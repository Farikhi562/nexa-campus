'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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
  'Arsitektur',
]

export default function EditProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
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
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

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

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        jurusan: profile.jurusan,
        universitas: profile.universitas,
        provinsi: profile.provinsi,
        updated_at: new Date().toISOString(),
      })
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Profil</h1>
          <p className="text-slate-600 text-sm">Perbarui informasi profil kamu</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={profile.full_name || ''}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
            placeholder="Nama lengkap"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Major */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Jurusan
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
            Universitas
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
            Provinsi
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
            <p className="text-sm text-green-700">Profil berhasil diperbarui!</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
          <Link href="/dashboard">
            <Button type="button" variant="secondary" className="w-full">
              Batal
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
