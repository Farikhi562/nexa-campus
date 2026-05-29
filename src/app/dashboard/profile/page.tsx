'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, Camera, CheckCircle2, ChevronDown, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import BadgesGrid from '@/components/BadgesGrid'
import type { Profile } from '@/types'
import { MAJOR_UNIVERSITIES, MAJORS, PROVINCES } from '@/lib/indonesia-data'

function UniversityCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered =
    query.length >= 2
      ? MAJOR_UNIVERSITIES.filter((university) =>
          university.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8)
      : []

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)

        if (query.trim()) {
          onChange(query.trim())
        }
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [query, onChange])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cari atau ketik nama universitas..."
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              onChange('')
              setOpen(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.map((university) => (
            <button
              key={university}
              type="button"
              onMouseDown={() => {
                onChange(university)
                setQuery(university)
                setOpen(false)
              }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 transition first:rounded-t-lg last:rounded-b-lg hover:bg-brand-50 hover:text-brand-700"
            >
              {university}
            </button>
          ))}

          {query.length >= 2 && (
            <button
              type="button"
              onMouseDown={() => {
                onChange(query.trim())
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-b-lg border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              <span>+ Gunakan &ldquo;{query}&rdquo;</span>
            </button>
          )}
        </div>
      )}

      {open && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <button
            type="button"
            onMouseDown={() => {
              onChange(query.trim())
              setOpen(false)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            + Gunakan &ldquo;{query}&rdquo; sebagai universitas
          </button>
        </div>
      )}

      {value && !MAJOR_UNIVERSITIES.includes(value) && (
        <p className="mt-1 text-xs text-slate-500">
          ✓ Input manual: <span className="font-medium">{value}</span>
        </p>
      )}
    </div>
  )
}

export default function EditProfilePage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const response = await fetch('/api/user/profile', {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      setError('Gagal memuat profil.')
      setLoading(false)
      return
    }

    const profileData = (await response.json()) as Profile

    setProfile(profileData)
    setAvatarPreview(profileData.avatar_url || null)
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Foto maksimal 5MB.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format foto harus JPG, PNG, atau WebP.')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
    setSuccess(false)
  }

  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!avatarFile) {
      return profile.avatar_url || null
    }

    setUploadingPhoto(true)

    try {
      const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${userId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path)

      return `${publicUrl}?t=${Date.now()}`
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Sesi tidak valid. Login ulang dulu.')
      }

      const avatarUrl = await uploadAvatar(user.id)

      const updates: Record<string, unknown> = {
        full_name: profile.full_name || null,
        jurusan: profile.jurusan || null,
        universitas: profile.universitas || null,
        provinsi: profile.provinsi || null,
        telegram_chat_id: profile.telegram_chat_id || null,
        is_public_profile: Boolean(profile.is_public_profile),
      }

      if (avatarUrl) {
        updates.avatar_url = avatarUrl
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil.')
      }

      const updatedProfile = data as Profile

      setProfile(updatedProfile)
      setAvatarFile(null)
      setAvatarPreview(updatedProfile.avatar_url || null)
      setSuccess(true)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? `Gagal menyimpan profil: ${err.message}` : 'Gagal menyimpan profil.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-slate-500">Memuat profil...</p>
        </div>
      </div>
    )
  }

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="rounded-lg p-2 transition hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>

        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Edit Profil</h1>
          <p className="text-sm text-slate-600">Perbarui informasi profil kamu</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-slate-900">Foto Profil</h2>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative flex-shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-white">{initials}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-lg transition hover:bg-brand-700"
            >
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          </div>

          <div className="text-center sm:text-left">
            <p className="mb-1 text-sm font-semibold text-slate-700">Upload foto profil</p>
            <p className="mb-3 text-xs text-slate-500">JPG, PNG, atau WebP. Maks 5MB.</p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Camera className="h-4 w-4" />
              Pilih Foto
            </button>

            {avatarFile && <p className="mt-2 text-xs font-medium text-emerald-600">✓ {avatarFile.name} dipilih</p>}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Informasi Akademik</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Lengkap</label>
          <input
            type="text"
            value={profile.full_name || ''}
            onChange={(event) => setProfile({ ...profile, full_name: event.target.value })}
            placeholder="Nama lengkap"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Jurusan / Program Studi</label>
          <div className="relative">
            <select
              value={profile.jurusan || ''}
              onChange={(event) => setProfile({ ...profile, jurusan: event.target.value })}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Pilih Jurusan</option>
              {MAJORS.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Universitas / Perguruan Tinggi</label>
          <UniversityCombobox
            value={profile.universitas || ''}
            onChange={(value) => setProfile({ ...profile, universitas: value })}
          />
          <p className="mt-1 text-xs text-slate-400">
            Ketik min. 2 huruf untuk cari. Tidak ada? Ketik nama universitas kamu lalu tekan &ldquo;Gunakan&rdquo;.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Provinsi</label>
          <div className="relative">
            <select
              value={profile.provinsi || ''}
              onChange={(event) => setProfile({ ...profile, provinsi: event.target.value })}
              className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Pilih Provinsi</option>
              {PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Telegram chat_id</label>
          <input
            type="text"
            value={profile.telegram_chat_id || ''}
            onChange={(event) => setProfile({ ...profile, telegram_chat_id: event.target.value })}
            placeholder="Chat /start ke @NEXATchBot lalu isi chat_id"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-slate-400">Dipakai untuk reminder Telegram otomatis via @NEXATchBot.</p>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={Boolean(profile.is_public_profile)}
            onChange={(event) => setProfile({ ...profile, is_public_profile: event.target.checked })}
            className="mt-1"
          />
          <span>
            <span className="block font-black text-slate-900">Tampilkan profil di leaderboard</span>
            Nama, kampus, rata-rata score, total exam, dan streak kamu akan terlihat untuk user lain.
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
            <p className="text-sm text-green-700">Profil berhasil diperbarui!</p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Button type="submit" disabled={saving || uploadingPhoto} className="flex-1">
            {saving || uploadingPhoto ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>

          <Link href="/dashboard" className="sm:w-auto">
            <Button type="button" variant="secondary" className="w-full">
              Batal
            </Button>
          </Link>
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Badge Belajar</h2>
        <p className="mt-1 text-sm text-slate-500">Badge berwarna berarti sudah kamu dapatkan.</p>
        <div className="mt-4">
          <BadgesGrid earned={Array.isArray(profile.badges) ? profile.badges : []} />
        </div>
      </section>
    </div>
  )
}