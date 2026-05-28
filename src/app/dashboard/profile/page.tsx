'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2, ArrowLeft, Camera, User, Search, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'
import { MAJOR_UNIVERSITIES, PROVINCES, MAJORS } from '@/lib/indonesia-data'

// Combobox: search + manual input
function UniversityCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length >= 2
    ? MAJOR_UNIVERSITIES.filter((u) =>
        u.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        // If query doesn't match any option, treat as manual input
        if (query.trim()) onChange(query.trim())
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [query, onChange])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cari atau ketik nama universitas..."
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.map((uni) => (
            <button
              key={uni}
              type="button"
              onMouseDown={() => {
                onChange(uni)
                setQuery(uni)
                setOpen(false)
              }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition first:rounded-t-lg last:rounded-b-lg"
            >
              {uni}
            </button>
          ))}
          {query.length >= 2 && (
            <button
              type="button"
              onMouseDown={() => {
                onChange(query.trim())
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-brand-600 font-semibold hover:bg-brand-50 transition rounded-b-lg"
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
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-brand-600 font-semibold hover:bg-brand-50 transition rounded-lg"
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
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Photo upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      if (profileData.avatar_url) {
        setAvatarPreview(profileData.avatar_url)
      }
    }

    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
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
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
    setError('')
  }

  async function uploadAvatar(userId: string): Promise<string | null> {
    if (!avatarFile) return profile.avatar_url || null

    setUploadingPhoto(true)
    const ext = avatarFile.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatarFile, { upsert: true })

    if (uploadError) {
      setError('Gagal upload foto: ' + uploadError.message)
      setUploadingPhoto(false)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    setUploadingPhoto(false)
    return publicUrl + `?t=${Date.now()}` // cache bust
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sesi tidak valid')
      setSaving(false)
      return
    }

    // Upload photo first if changed
    const avatarUrl = await uploadAvatar(user.id)
    if (uploadingPhoto) return // still uploading (shouldn't happen but guard)

    const updates: Record<string, unknown> = {
      full_name: profile.full_name,
      jurusan: profile.jurusan,
      universitas: profile.universitas,
      provinsi: profile.provinsi,
      updated_at: new Date().toISOString(),
    }

    if (avatarUrl) updates.avatar_url = avatarUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    setSaving(false)

    if (updateError) {
      setError('Gagal menyimpan profil: ' + updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Memuat profil...</p>
        </div>
      </div>
    )
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Edit Profil</h1>
          <p className="text-slate-600 text-sm">Perbarui informasi profil kamu</p>
        </div>
      </div>

      {/* Avatar section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Foto Profil</h2>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar preview */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-black text-white">{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shadow-lg border-2 border-white hover:bg-brand-700 transition"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Upload info */}
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-slate-700 mb-1">Upload foto profil</p>
            <p className="text-xs text-slate-500 mb-3">JPG, PNG, atau WebP. Maks 5MB.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Camera className="w-4 h-4" />
              Pilih Foto
            </button>
            {avatarFile && (
              <p className="mt-2 text-xs text-emerald-600 font-medium">
                ✓ {avatarFile.name} dipilih
              </p>
            )}
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

      {/* Info form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900">Informasi Akademik</h2>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={profile.full_name || ''}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            placeholder="Nama lengkap"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Major */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Jurusan / Program Studi
          </label>
          <div className="relative">
            <select
              value={profile.jurusan || ''}
              onChange={(e) => setProfile({ ...profile, jurusan: e.target.value })}
              className="w-full appearance-none px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white pr-10"
            >
              <option value="">Pilih Jurusan</option>
              {MAJORS.map((major) => (
                <option key={major} value={major}>{major}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* University — searchable combobox */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Universitas / Perguruan Tinggi
          </label>
          <UniversityCombobox
            value={profile.universitas || ''}
            onChange={(v) => setProfile({ ...profile, universitas: v })}
          />
          <p className="mt-1 text-xs text-slate-400">
            Ketik min. 2 huruf untuk cari. Tidak ada? Ketik nama universitas kamu lalu tekan &ldquo;Gunakan&rdquo;.
          </p>
        </div>

        {/* Province */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Provinsi
          </label>
          <div className="relative">
            <select
              value={profile.provinsi || ''}
              onChange={(e) => setProfile({ ...profile, provinsi: e.target.value })}
              className="w-full appearance-none px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-white pr-10"
            >
              <option value="">Pilih Provinsi</option>
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Profil berhasil diperbarui!</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            type="submit"
            disabled={saving || uploadingPhoto}
            className="flex-1"
          >
            {saving || uploadingPhoto ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
          <Link href="/dashboard" className="sm:w-auto">
            <Button type="button" variant="secondary" className="w-full">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
