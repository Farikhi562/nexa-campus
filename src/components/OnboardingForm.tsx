'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle2, GraduationCap, Info, MapPin, ShieldCheck, Upload, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import {
  GENDER_OPTIONS,
  MAJOR_OPTIONS,
  PROVINCE_OPTIONS,
  UNIVERSITY_OPTIONS,
} from '@/lib/profile-options'
import type { Profile } from '@/types'

function isSchemaError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === 'PGRST204' ||
    error.code === '42703' ||
    message.includes('column') ||
    message.includes('schema cache')
  )
}

const inputClass =
  'focus-ring w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 hover:border-slate-400'
const labelClass = 'mb-1.5 block text-sm font-black text-slate-700'

export default function OnboardingForm({
  profile,
  referralCode,
}: {
  profile: Partial<Profile>
  referralCode?: string
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [campusName, setCampusName] = useState(profile.campus_name ?? '')
  const [province, setProvince] = useState(profile.province ?? '')
  const [major, setMajor] = useState(profile.major ?? '')
  const [semester, setSemester] = useState(String(profile.semester ?? 1))
  const [gender, setGender] = useState(profile.gender ?? '')
  const [studentId, setStudentId] = useState(profile.student_id ?? '')
  const [telegramChatId, setTelegramChatId] = useState(profile.telegram_chat_id ?? '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? '')
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsapp_number ?? '')

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function uploadPhoto(): Promise<{ ok: boolean; url?: string }> {
    if (!photoFile) return { ok: true, url: avatarUrl || undefined }

    setUploadingPhoto(true)
    setError('')

    const formData = new FormData()
    formData.append('photo', photoFile)

    const response = await fetch('/api/profile/photo', { method: 'POST', body: formData })
    const result = (await response.json().catch(() => null)) as { avatar_url?: string; error?: string } | null

    setUploadingPhoto(false)

    if (!response.ok || !result?.avatar_url) {
      setError(result?.error || 'Foto gagal diupload. Coba lagi atau lanjut tanpa foto dulu.')
      return { ok: false }
    }

    setAvatarUrl(result.avatar_url)
    setPhotoFile(null)
    setPhotoPreview('')
    return { ok: true, url: result.avatar_url }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!fullName.trim()) return setError('Nama lengkap wajib diisi.')
    if (!campusName.trim()) return setError('Kampus wajib diisi. Kalau belum ada di daftar, ketik manual aja.')
    if (!province.trim()) return setError('Provinsi wajib dipilih.')
    if (!major.trim()) return setError('Jurusan wajib dipilih.')

    const parsedSemester = Number(semester)
    if (!Number.isFinite(parsedSemester) || parsedSemester < 1 || parsedSemester > 14) {
      return setError('Semester harus antara 1 sampai 14.')
    }

    setLoading(true)

    // Upload foto dulu kalau ada yang dipilih tapi belum keupload.
    let resolvedAvatarUrl = avatarUrl
    if (photoFile) {
      const uploaded = await uploadPhoto()
      if (!uploaded.ok) {
        setLoading(false)
        return
      }
      resolvedAvatarUrl = uploaded.url ?? avatarUrl
    }

    // PENTING: jangan kirim "plan" dari sini. Plan dikelola server (trigger/admin/
    // referral). Mengirim plan lama bisa melanggar constraint profiles_plan_check.
    const corePayload: Record<string, unknown> = {
      id: profile.id,
      email: profile.email,
      full_name: fullName.trim(),
      campus_name: campusName.trim(),
      major: major.trim(),
      semester: parsedSemester,
      student_id: studentId.trim() || null,
      phone_number: phoneNumber.trim() || null,
      telegram_chat_id: telegramChatId.trim() || null,
      whatsapp_number: whatsappNumber.trim() || null,
      profile_completed: true,
    }

    const fullPayload: Record<string, unknown> = {
      ...corePayload,
      province: province.trim() || null,
      gender: gender || null,
      avatar_url: resolvedAvatarUrl || null,
    }

    // Coba simpan lengkap. Kalau ada kolom opsional yang belum ada di DB,
    // jangan gagalkan onboarding — turun bertahap ke field inti, lalu minimal.
    let upsertError = (await supabase.from('profiles').upsert(fullPayload)).error
    if (upsertError && isSchemaError(upsertError)) {
      upsertError = (await supabase.from('profiles').upsert(corePayload)).error
    }
    if (upsertError && isSchemaError(upsertError)) {
      const minimalPayload = {
        id: profile.id,
        email: profile.email,
        full_name: fullName.trim(),
        profile_completed: true,
      }
      upsertError = (await supabase.from('profiles').upsert(minimalPayload)).error
    }

    setLoading(false)

    if (upsertError) {
      setError(
        isSchemaError(upsertError)
          ? 'Profil gagal disimpan karena struktur database belum lengkap. Minta admin menjalankan supabase/setup_all.sql di Supabase, lalu coba lagi.'
          : `Profil gagal disimpan: ${upsertError.message}`
      )
      return
    }

    const storedReferralCode =
      referralCode ||
      (typeof window !== 'undefined' ? window.sessionStorage.getItem('nexa_referral_code') || '' : '')

    if (storedReferralCode) {
      await fetch('/api/referrals/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: storedReferralCode }),
      }).catch(() => null)
      window.sessionStorage.removeItem('nexa_referral_code')
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Foto profil */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 text-slate-400">
            {photoPreview || avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview || avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-9 w-9" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-slate-950">Foto profil (opsional)</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              JPG, PNG, WebP, atau GIF. Maksimal 2MB. Bisa di-skip dan ditambah nanti.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                <Upload className="h-4 w-4" />
                {photoFile ? 'Ganti Foto' : 'Pilih Foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setPhotoFile(file)
                    setPhotoPreview(file ? URL.createObjectURL(file) : '')
                  }}
                />
              </label>
              {photoFile && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingPhoto}
                  onClick={uploadPhoto}
                  className="min-h-11 rounded-2xl"
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Sekarang'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Identitas akademik */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>
            Pilih kampus, provinsi, dan jurusan dari daftar. Belum ada di daftar? Pilih
            <span className="font-black"> &ldquo;Lainnya&rdquo;</span> atau ketik manual untuk kampus.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4 text-teal-700" /> Nama lengkap</span>
            </span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} placeholder="Nama sesuai yang kamu mau tampil" />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-teal-700" /> Kampus / universitas</span>
            </span>
            <input
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              list="onboarding-universities"
              required
              className={inputClass}
              placeholder="Contoh: Universitas Gunadarma"
            />
            <datalist id="onboarding-universities">
              {UNIVERSITY_OPTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <span className="mt-1.5 block text-xs leading-5 text-slate-500">
              Pilih dari saran, atau ketik manual kalau kampusmu belum ada.
            </span>
          </label>

          <label className="block">
            <span className={labelClass}>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-teal-700" /> Provinsi</span>
            </span>
            <select value={province} onChange={(e) => setProvince(e.target.value)} required className={inputClass}>
              <option value="">Pilih provinsi</option>
              {PROVINCE_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Jurusan</span>
            <select value={major} onChange={(e) => setMajor(e.target.value)} required className={inputClass}>
              <option value="">Pilih jurusan</option>
              {MAJOR_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Semester</span>
            <input type="number" min="1" max="14" value={semester} onChange={(e) => setSemester(e.target.value)} required className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Gender (opsional)</span>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              {GENDER_OPTIONS.map((item) => (
                <option key={item.value || 'empty'} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Opsional / kontak */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-black text-slate-950">Detail tambahan (opsional)</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Telegram bisa diisi untuk testing reminder. WhatsApp masih roadmap/coming soon.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>NPM / Student ID</span>
            <input value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Telegram chat ID</span>
            <input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Nomor HP</span>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>WhatsApp</span>
            <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className={inputClass} />
          </label>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-700" />
        <p>NEXA tidak pernah meminta password kampus. Data yang disimpan hanya profil dan deadline yang kamu input sendiri.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</p>
      )}

      <Button type="submit" disabled={loading || uploadingPhoto} className="min-h-12 w-full rounded-2xl">
        {loading ? 'Menyimpan...' : 'Simpan & Masuk Dashboard'}
        {!loading && <CheckCircle2 className="h-4 w-4" />}
      </Button>
    </form>
  )
}
