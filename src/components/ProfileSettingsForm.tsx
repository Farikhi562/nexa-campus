'use client'

import { useMemo, useState } from 'react'
import { BellRing, BookOpen, CheckCircle2, GraduationCap, Radar, Rocket, Sparkles, UserRound } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const provinces = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bangka Belitung',
  'Bengkulu',
  'Lampung',
  'Banten',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Barat Daya',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Selatan',
  'Lainnya',
]

const avatarOptions = [
  { value: 'user', label: 'User', icon: UserRound },
  { value: 'graduation', label: 'Kampus', icon: GraduationCap },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'rocket', label: 'Rocket', icon: Rocket },
  { value: 'radar', label: 'Radar', icon: Radar },
  { value: 'bell', label: 'Bell', icon: BellRing },
  { value: 'sparkles', label: 'Spark', icon: Sparkles },
]

const genderOptions = [
  { value: '', label: 'Tidak diisi' },
  { value: 'laki_laki', label: 'Laki-laki' },
  { value: 'perempuan', label: 'Perempuan' },
  { value: 'lainnya', label: 'Lainnya' },
  { value: 'tidak_ingin_menyebutkan', label: 'Tidak ingin menyebutkan' },
]

export default function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const supabase = useMemo(() => createClient(), [])
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [campusName, setCampusName] = useState(profile.campus_name ?? '')
  const [province, setProvince] = useState(profile.province ?? '')
  const [major, setMajor] = useState(profile.major ?? '')
  const [semester, setSemester] = useState(String(profile.semester ?? 1))
  const [studentId, setStudentId] = useState(profile.student_id ?? '')
  const [gender, setGender] = useState(profile.gender ?? '')
  const [avatarIcon, setAvatarIcon] = useState(profile.avatar_icon ?? 'graduation')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const parsedSemester = Number(semester)
    if (!fullName.trim()) {
      setLoading(false)
      setError('Nama wajib diisi.')
      return
    }
    if (!campusName.trim()) {
      setLoading(false)
      setError('Nama kampus wajib diisi. Kalau belum ada di daftar, tulis manual aja.')
      return
    }
    if (!major.trim()) {
      setLoading(false)
      setError('Jurusan wajib diisi.')
      return
    }
    if (!Number.isFinite(parsedSemester) || parsedSemester < 1 || parsedSemester > 14) {
      setLoading(false)
      setError('Semester harus antara 1 sampai 14.')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        campus_name: campusName.trim(),
        province: province || null,
        major: major.trim(),
        semester: parsedSemester,
        student_id: studentId.trim() || null,
        gender: gender || null,
        avatar_icon: avatarIcon,
      })
      .eq('id', profile.id)

    setLoading(false)

    if (updateError) {
      setError('Profil gagal disimpan. Coba lagi sebentar.')
      return
    }

    setMessage('Profil berhasil diupdate. Identitas kampusmu sekarang lebih rapi.')
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="brand" className="mb-3">Profile</Badge>
            <h2 className="text-xl font-black text-slate-950">Identitas akun</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Kampus pakai input bebas dulu, jadi semua universitas di Indonesia tetap bisa masuk tanpa nunggu daftar resmi.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <UserRound className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama lengkap</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama kampus / universitas</span>
            <input value={campusName} onChange={(event) => setCampusName(event.target.value)} placeholder="Contoh: Universitas Gunadarma" className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Provinsi</span>
            <select value={province} onChange={(event) => setProvince(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              <option value="">Pilih provinsi</option>
              {provinces.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Jurusan</span>
            <input value={major} onChange={(event) => setMajor(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Semester</span>
            <input type="number" min="1" max="14" value={semester} onChange={(event) => setSemester(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">NPM / student ID opsional</span>
            <input value={studentId} onChange={(event) => setStudentId(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Gender opsional</span>
            <select value={gender} onChange={(event) => setGender(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              {genderOptions.map((item) => <option key={item.value || 'empty'} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Foto profil icon</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Upload foto asli belum dibuat dulu. Untuk MVP, pilih icon biar profil tetap punya wajah kecil yang rapi.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-7">
          {avatarOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAvatarIcon(value)}
              className={`focus-ring flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-black transition ${
                avatarIcon === value
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}
      {message && (
        <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          {message}
        </div>
      )}

      <Button type="submit" disabled={loading} className="min-h-12 rounded-2xl">
        {loading ? 'Menyimpan...' : 'Simpan Profil'}
      </Button>
    </form>
  )
}
