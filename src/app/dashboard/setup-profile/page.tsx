'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Profile } from '@/types'

const UNIVERSITIES = [
  'Universitas Indonesia',
  'ITB (Institut Teknologi Bandung)',
  'Universitas Gadjah Mada',
  'Universitas Airlangga',
  'Universitas Diponegoro',
  'Universitas Padjadjaran',
  'Universitas Brawijaya',
  'Universitas Hasanuddin',
  'Universitas Syiah Kuala',
  'Universitas Sumatera Utara',
]

const PROVINCES = [
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
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Banten',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Maluku',
  'Maluku Utara',
  'Papua Barat',
  'Papua',
]

const MAJORS = [
  'Teknik Informatika',
  'Teknik Mesin',
  'Teknik Elektro',
  'Teknik Sipil',
  'Teknik Industri',
  'Sistem Informasi',
  'Manajemen',
  'Akuntansi',
  'Hukum',
  'Kedokteran',
  'Farmasi',
  'Psikologi',
  'Pendidikan',
  'Biologi',
  'Kimia',
  'Fisika',
  'Matematika',
  'Seni Rupa',
  'Musik',
  'Arsitek tur',
]

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

  useEffect(() => {
    async function loadProfile() {
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
        // If already completed, redirect to dashboard
        if (profileData.profile_completed) {
          router.push('/dashboard')
          return
        }
      } else {
        setProfile({
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          jurusan: '',
          universitas: '',
          provinsi: '',
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!profile.full_name?.trim()) {
      setError('Nama lengkap harus diisi')
      return
    }
    if (!profile.jurusan?.trim()) {
      setError('Jurusan harus dipilih')
      return
    }
    if (!profile.universitas?.trim()) {
      setError('Universitas harus dipilih')
      return
    }
    if (!profile.provinsi?.trim()) {
      setError('Provinsi harus dipilih')
      return
    }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sesi tidak valid')
      setSaving(false)
      return
    }

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: profile.full_name.trim(),
        jurusan: profile.jurusan.trim(),
        universitas: profile.universitas.trim(),
        provinsi: profile.provinsi.trim(),
        profile_completed: true,
      }),
    })

    const result = await response.json()

    setSaving(false)

    if (!response.ok) {
      setError('Gagal menyimpan profil: ' + (result.error || 'Terjadi kesalahan'))
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Lengkapi Profil Kamu</h1>
          <p className="text-slate-600 text-sm">
            Informasi ini akan membantu kami memberikan pengalaman belajar terbaik
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
              placeholder="Contoh: Muhammad Rizki"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Major */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jurusan *
            </label>
            <select
              value={profile.jurusan || ''}
              onChange={(e) =>
                setProfile({ ...profile, jurusan: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Pilih Jurusan</option>
              {MAJORS.map((major) => (
                <option key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>
          </div>

          {/* University */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Universitas *
            </label>
            <select
              value={profile.universitas || ''}
              onChange={(e) =>
                setProfile({ ...profile, universitas: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Pilih Universitas</option>
              {UNIVERSITIES.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Provinsi *
            </label>
            <select
              value={profile.provinsi || ''}
              onChange={(e) =>
                setProfile({ ...profile, provinsi: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Pilih Provinsi</option>
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Profil berhasil disimpan! Mengalihkan...</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={saving || success}
            className="w-full"
          >
            {saving ? 'Menyimpan...' : success ? 'Berhasil!' : 'Lanjutkan ke Dashboard'}
          </Button>
        </form>

        {/* Info */}
        <p className="text-xs text-slate-500 text-center mt-6">
          Anda dapat mengubah informasi ini nanti di pengaturan profil
        </p>
      </div>
    </div>
  )
}
