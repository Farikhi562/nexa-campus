'use client'

import { useState } from 'react'
import { BellRing, BookOpen, Camera, CheckCircle2, GraduationCap, Radar, Rocket, Sparkles, Upload, UserRound } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
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

const universityOptions = [
  'Universitas Indonesia',
  'Universitas Gadjah Mada',
  'Institut Teknologi Bandung',
  'Institut Pertanian Bogor',
  'Institut Teknologi Sepuluh Nopember',
  'Universitas Airlangga',
  'Universitas Padjadjaran',
  'Universitas Diponegoro',
  'Universitas Brawijaya',
  'Universitas Sebelas Maret',
  'Universitas Sumatera Utara',
  'Universitas Andalas',
  'Universitas Sriwijaya',
  'Universitas Lampung',
  'Universitas Riau',
  'Universitas Jambi',
  'Universitas Bengkulu',
  'Universitas Syiah Kuala',
  'Universitas Negeri Jakarta',
  'Universitas Pendidikan Indonesia',
  'Universitas Negeri Yogyakarta',
  'Universitas Negeri Semarang',
  'Universitas Negeri Malang',
  'Universitas Negeri Surabaya',
  'Universitas Negeri Padang',
  'Universitas Negeri Medan',
  'Universitas Negeri Makassar',
  'Universitas Udayana',
  'Universitas Mataram',
  'Universitas Nusa Cendana',
  'Universitas Tanjungpura',
  'Universitas Lambung Mangkurat',
  'Universitas Mulawarman',
  'Universitas Palangka Raya',
  'Universitas Hasanuddin',
  'Universitas Sam Ratulangi',
  'Universitas Tadulako',
  'Universitas Halu Oleo',
  'Universitas Pattimura',
  'Universitas Cenderawasih',
  'Universitas Terbuka',
  'Universitas Gunadarma',
  'Universitas Bina Nusantara',
  'Universitas Telkom',
  'Universitas Trisakti',
  'Universitas Tarumanagara',
  'Universitas Atma Jaya Jakarta',
  'Universitas Pelita Harapan',
  'Universitas Mercu Buana',
  'Universitas Esa Unggul',
  'Universitas Muhammadiyah Yogyakarta',
  'Universitas Muhammadiyah Malang',
  'Universitas Ahmad Dahlan',
  'Universitas Islam Indonesia',
  'Universitas Islam Negeri Syarif Hidayatullah Jakarta',
  'Universitas Islam Negeri Sunan Kalijaga Yogyakarta',
  'Universitas Islam Negeri Maulana Malik Ibrahim Malang',
  'Universitas Kristen Satya Wacana',
  'Universitas Kristen Petra',
  'Universitas Katolik Parahyangan',
  'Politeknik Negeri Jakarta',
  'Politeknik Negeri Bandung',
  'Politeknik Elektronika Negeri Surabaya',
  'Politeknik Negeri Malang',
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
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [campusName, setCampusName] = useState(profile.campus_name ?? '')
  const [province, setProvince] = useState(profile.province ?? '')
  const [major, setMajor] = useState(profile.major ?? '')
  const [semester, setSemester] = useState(String(profile.semester ?? 1))
  const [studentId, setStudentId] = useState(profile.student_id ?? '')
  const [gender, setGender] = useState(profile.gender ?? '')
  const [avatarIcon, setAvatarIcon] = useState(profile.avatar_icon ?? 'graduation')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
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

    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName.trim(),
        campus_name: campusName.trim(),
        province: province || null,
        major: major.trim(),
        semester: parsedSemester,
        student_id: studentId.trim() || null,
        gender: gender || null,
        avatar_icon: avatarIcon,
      }),
    })
    const result = (await response.json().catch(() => null)) as { error?: string } | null

    setLoading(false)

    if (!response.ok) {
      setError(result?.error || 'Profil gagal disimpan. Coba lagi sebentar.')
      return
    }

    setMessage('Profil berhasil diupdate. Identitas kampusmu sekarang lebih rapi.')
  }

  async function uploadPhoto() {
    if (!photoFile) {
      setError('Pilih foto dulu.')
      return
    }

    setUploadingPhoto(true)
    setError('')
    setMessage('')

    const formData = new FormData()
    formData.append('photo', photoFile)

    const response = await fetch('/api/profile/photo', {
      method: 'POST',
      body: formData,
    })
    const result = (await response.json().catch(() => null)) as { avatar_url?: string; error?: string } | null

    setUploadingPhoto(false)

    if (!response.ok || !result?.avatar_url) {
      setError(result?.error || 'Foto gagal diupload. Coba lagi sebentar.')
      return
    }

    setAvatarUrl(result.avatar_url)
    setPhotoFile(null)
    setPhotoPreview('')
    setMessage('Foto profil berhasil diupload.')
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
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-400">
                {photoPreview || avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview || avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-9 w-9" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-950">Upload foto profil</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  JPG, PNG, WebP, atau GIF. Maksimal 2MB. Kalau belum upload, icon profil tetap dipakai.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                    Pilih Foto
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
                  <Button type="button" variant="outline" disabled={!photoFile || uploadingPhoto} onClick={uploadPhoto} className="min-h-11 rounded-2xl">
                    {uploadingPhoto ? 'Uploading...' : 'Upload Foto'}
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama lengkap</span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nama kampus / universitas</span>
            <input
              value={campusName}
              onChange={(event) => setCampusName(event.target.value)}
              list="university-options"
              placeholder="Contoh: Universitas Gunadarma"
              className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            <datalist id="university-options">
              {universityOptions.map((item) => <option key={item} value={item} />)}
            </datalist>
            <span className="mt-1.5 block text-xs leading-5 text-slate-500">
              Pilih dari saran, atau ketik manual kalau kampusmu belum ada.
            </span>
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
