'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2, Camera, Search, X, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'
import { MAJOR_UNIVERSITIES, PROVINCES, MAJORS } from '@/lib/indonesia-data'

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

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
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
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Cari atau ketik nama universitas..."
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); onChange(''); setOpen(false) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
          {filtered.map((uni) => (
            <button key={uni} type="button"
              onMouseDown={() => { onChange(uni); setQuery(uni); setOpen(false) }}
              className="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition">
              {uni}
            </button>
          ))}
          <button type="button"
            onMouseDown={() => { onChange(query.trim()); setOpen(false) }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-brand-600 font-semibold hover:bg-brand-50 transition">
            + Gunakan &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
      {open && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <button type="button"
            onMouseDown={() => { onChange(query.trim()); setOpen(false) }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-brand-600 font-semibold hover:bg-brand-50 transition rounded-lg">
            + Gunakan &ldquo;{query}&rdquo; sebagai universitas
          </button>
        </div>
      )}
    </div>
  )
}

export default function SetupProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    jurusan: '',
    universitas: '',
    provinsi: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Photo
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    if (profileData) {
      setProfile(profileData)
      if (profileData.profile_completed) { router.push('/dashboard'); return }
      if (profileData.avatar_url) setAvatarPreview(profileData.avatar_url)
    } else {
      setProfile({
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        jurusan: '',
        universitas: '',
        provinsi: '',
      })
      if (user.user_metadata?.avatar_url) {
        setAvatarPreview(user.user_metadata.avatar_url)
      }
    }
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Foto maksimal 5MB.'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!profile.full_name?.trim()) { setError('Nama lengkap harus diisi'); return }
    if (!profile.jurusan?.trim()) { setError('Jurusan harus dipilih'); return }
    if (!profile.universitas?.trim()) { setError('Universitas harus diisi'); return }
    if (!profile.provinsi?.trim()) { setError('Provinsi harus dipilih'); return }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sesi tidak valid'); setSaving(false); return }

    // Upload avatar if provided
    let avatarUrl = profile.avatar_url || null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, avatarFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = publicUrl + `?t=${Date.now()}`
      }
    }

    const body: Record<string, unknown> = {
      full_name: profile.full_name.trim(),
      jurusan: profile.jurusan.trim(),
      universitas: profile.universitas.trim(),
      provinsi: profile.provinsi.trim(),
      profile_completed: true,
    }
    if (avatarUrl) body.avatar_url = avatarUrl

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    setSaving(false)

    if (!response.ok) {
      setError('Gagal menyimpan profil: ' + (result.error || 'Terjadi kesalahan'))
      return
    }

    setSuccess(true)
    setTimeout(() => { router.push('/dashboard') }, 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Memuat profil...</p>
        </div>
      </div>
    )
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-cyan-600 px-8 py-6 text-center text-white">
          <h1 className="text-2xl font-black mb-1">Lengkapi Profil Kamu</h1>
          <p className="text-brand-100 text-sm">Satu kali setup, pengalaman belajar jadi personal</p>
        </div>

        <div className="p-6 sm:p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-white">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shadow-md border-2 border-white hover:bg-brand-700 transition"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-brand-600 font-semibold hover:underline"
            >
              Upload foto profil (opsional)
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange} className="hidden" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Contoh: Muhammad Rizki"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Major */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Jurusan / Program Studi *
              </label>
              <div className="relative">
                <select
                  value={profile.jurusan || ''}
                  onChange={(e) => setProfile({ ...profile, jurusan: e.target.value })}
                  className="w-full appearance-none px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white pr-10"
                >
                  <option value="">Pilih Jurusan</option>
                  {MAJORS.map((major) => (
                    <option key={major} value={major}>{major}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Universitas *
              </label>
              <UniversityCombobox
                value={profile.universitas || ''}
                onChange={(v) => setProfile({ ...profile, universitas: v })}
              />
              <p className="mt-1 text-xs text-slate-400">
                Ketik 2+ huruf untuk cari, atau input manual nama kampus kamu.
              </p>
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Provinsi *
              </label>
              <div className="relative">
                <select
                  value={profile.provinsi || ''}
                  onChange={(e) => setProfile({ ...profile, provinsi: e.target.value })}
                  className="w-full appearance-none px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm bg-white pr-10"
                >
                  <option value="">Pilih Provinsi</option>
                  {PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">Profil berhasil disimpan! Mengalihkan...</p>
              </div>
            )}

            <Button type="submit" disabled={saving || success} className="w-full">
              {saving ? 'Menyimpan...' : success ? 'Berhasil!' : 'Lanjutkan ke Dashboard →'}
            </Button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-4">
            Kamu bisa mengubah info ini kapan saja di halaman profil
          </p>
        </div>
      </div>
    </div>
  )
}
