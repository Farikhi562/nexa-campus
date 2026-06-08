'use client'

import { useState } from 'react'
import { Camera, CheckCircle2, Info, Upload, UserRound } from 'lucide-react'
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

const majorOptions = [
  'Akuntansi',
  'Arsitektur',
  'Biologi',
  'Bisnis Digital',
  'Desain Komunikasi Visual',
  'Ekonomi Pembangunan',
  'Farmasi',
  'Fisika',
  'Hubungan Internasional',
  'Hukum',
  'Ilmu Administrasi',
  'Ilmu Komunikasi',
  'Ilmu Komputer',
  'Ilmu Politik',
  'Kedokteran',
  'Keperawatan',
  'Kimia',
  'Manajemen',
  'Matematika',
  'Pendidikan',
  'Psikologi',
  'Sastra Inggris',
  'Sistem Informasi',
  'Statistika',
  'Teknik Elektro',
  'Teknik Industri',
  'Teknik Informatika',
  'Teknik Kimia',
  'Teknik Mesin',
  'Teknik Sipil',
  'Teknologi Informasi',
  'Lainnya',
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
  const [isPublicProfile, setIsPublicProfile] = useState(profile.is_public_profile ?? true)
  const [publicProfileHeadline, setPublicProfileHeadline] = useState(profile.public_profile_headline ?? '')
  const [profileBio, setProfileBio] = useState(profile.profile_bio ?? '')
  const [profileBioVisibility, setProfileBioVisibility] = useState<'public' | 'private'>(profile.profile_bio_visibility === 'private' ? 'private' : 'public')
  const [profileSkills, setProfileSkills] = useState((profile.profile_skills ?? []).join(', '))
  const [profileSkillsVisibility, setProfileSkillsVisibility] = useState<'public' | 'private'>(profile.profile_skills_visibility === 'private' ? 'private' : 'public')
  const [profileInterests, setProfileInterests] = useState((profile.profile_interests ?? []).join(', '))
  const [profileInterestsVisibility, setProfileInterestsVisibility] = useState<'public' | 'private'>(profile.profile_interests_visibility === 'private' ? 'private' : 'public')
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolio_url ?? '')
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? '')
  const [onlineStatusVisibility, setOnlineStatusVisibility] = useState<'public' | 'friends' | 'private'>(profile.online_status_visibility ?? 'friends')
  const [studyRoomPresenceVisibility, setStudyRoomPresenceVisibility] = useState<'members' | 'private'>(profile.study_room_presence_visibility ?? 'members')
  const [dmPrivacy, setDmPrivacy] = useState<'friends' | 'none'>(profile.dm_privacy ?? 'friends')
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

    if (photoFile) {
      const uploaded = await uploadPhoto()
      if (!uploaded) {
        setLoading(false)
        return
      }
    }

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
        avatar_icon: null,
        is_public_profile: isPublicProfile,
        public_profile_headline: publicProfileHeadline.trim() || null,
        profile_bio: profileBio.trim() || null,
        profile_bio_visibility: profileBioVisibility,
        profile_skills: profileSkills,
        profile_skills_visibility: profileSkillsVisibility,
        profile_interests: profileInterests,
        profile_interests_visibility: profileInterestsVisibility,
        portfolio_url: portfolioUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        online_status_visibility: onlineStatusVisibility,
        study_room_presence_visibility: studyRoomPresenceVisibility,
        dm_privacy: dmPrivacy,
      }),
    })
    const result = (await response.json().catch(() => null)) as { error?: string; warning?: string } | null

    setLoading(false)

    if (!response.ok) {
      setError(result?.error || 'Profil gagal disimpan. Coba lagi sebentar.')
      return
    }

    setMessage(result?.warning || 'Profil berhasil diupdate. Identitas kampusmu sekarang lebih rapi.')
  }

  async function uploadPhoto() {
    if (!photoFile) {
      setError('Pilih foto dulu.')
      return false
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
      return false
    }

    setAvatarUrl(result.avatar_url)
    setPhotoFile(null)
    setPhotoPreview('')
    setMessage('Foto profil berhasil diupload.')
    return true
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-900">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-black">Panduan isi profil</p>
            <p className="mt-1">
              Isi nama asli, pilih kampus dari saran atau ketik manual kalau belum ada, pilih provinsi, lalu pilih jurusan dari daftar.
              Foto profil bersifat opsional, format JPG/PNG/WebP/GIF maksimal 2MB. NEXA tidak meminta password kampus.
            </p>
          </div>
        </div>
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
                  JPG, PNG, WebP, atau GIF. Maksimal 2MB. Kalau upload gagal, cek migration dan bucket Supabase Storage.
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
            <select value={major} onChange={(event) => setMajor(event.target.value)} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              <option value="">Pilih jurusan</option>
              {majorOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
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

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setIsPublicProfile((value) => !value)}
              className="focus-ring flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-200"
            >
              <span>
                <span className="block text-sm font-black text-slate-950">Tampil di leaderboard</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                  Kalau aktif, nama, foto, dan poinmu muncul di papan peringkat. Ini tidak menyembunyikan kamu dari Cari Teman atau anggota Study Room.
                </span>
              </span>
              <span
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
                  isPublicProfile ? 'bg-teal-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    isPublicProfile ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </span>
            </button>
          </div>

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4">
              <p className="text-sm font-black text-slate-950">Profil publik & skill</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ini yang muncul saat user lain klik profilmu dari Cari Teman, Leaderboard, atau NEXA Arena. Nama, kampus, jurusan, dan NEXA ID tetap terlihat supaya fitur sosial tidak mati gaya. Deskripsi, skill, minat, online status, dan chat pribadi tetap bisa kamu atur.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-black text-slate-700">Headline singkat</span>
                <input
                  value={publicProfileHeadline}
                  onChange={(event) => setPublicProfileHeadline(event.target.value)}
                  maxLength={120}
                  placeholder="Contoh: Junior AI Engineer · Backend learner · Business plan enthusiast"
                  className="focus-ring w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-black text-slate-700">
                  Deskripsi diri
                  <button
                    type="button"
                    onClick={() => setProfileBioVisibility((value) => value === 'public' ? 'private' : 'public')}
                    className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    {profileBioVisibility === 'public' ? 'Publik' : 'Privat'}
                  </button>
                </span>
                <textarea
                  value={profileBio}
                  onChange={(event) => setProfileBio(event.target.value)}
                  maxLength={800}
                  rows={5}
                  placeholder="Ceritain latar belakang, minat, pengalaman, atau arah belajar kamu. Jangan nulis CV 18 halaman, ini profil, bukan prasasti."
                  className="focus-ring w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-black text-slate-700">
                  Skill
                  <button
                    type="button"
                    onClick={() => setProfileSkillsVisibility((value) => value === 'public' ? 'private' : 'public')}
                    className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    {profileSkillsVisibility === 'public' ? 'Publik' : 'Privat'}
                  </button>
                </span>
                <input
                  value={profileSkills}
                  onChange={(event) => setProfileSkills(event.target.value)}
                  placeholder="Python, React, Supabase, UI/UX, Public speaking"
                  className="focus-ring w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                />
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">Pisahkan dengan koma. Skill ini juga ngebantu owner Arena ngecek pelamar.</span>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-black text-slate-700">
                  Minat / bidang belajar
                  <button
                    type="button"
                    onClick={() => setProfileInterestsVisibility((value) => value === 'public' ? 'private' : 'public')}
                    className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    {profileInterestsVisibility === 'public' ? 'Publik' : 'Privat'}
                  </button>
                </span>
                <input
                  value={profileInterests}
                  onChange={(event) => setProfileInterests(event.target.value)}
                  placeholder="AI, bisnis digital, hackathon, PKM, data science"
                  className="focus-ring w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-black text-slate-700">Portfolio URL</span>
                <input value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://..." className="focus-ring w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-black text-slate-700">GitHub URL</span>
                <input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/username" className="focus-ring w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-black text-slate-700">LinkedIn URL</span>
                <input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://linkedin.com/in/username" className="focus-ring w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm" />
              </label>

              <div className="md:col-span-2 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-950">Privasi sosial & Study Room</p>
                <p className="mt-1 text-xs leading-5 text-amber-900">Privasi di sini hanya untuk status online dan izin chat pribadi. Nama kamu tetap tampil di Cari Teman dan daftar anggota Study Room, karena kalau semuanya disembunyikan aplikasinya berubah jadi ruang kosong digital.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-amber-900">Status online</span>
                    <select value={onlineStatusVisibility} onChange={(event) => setOnlineStatusVisibility(event.target.value as 'public' | 'friends' | 'private')} className="focus-ring w-full rounded-2xl border border-amber-200 bg-white px-3 py-2.5 text-sm">
                      <option value="friends">Teman saja</option>
                      <option value="public">Publik</option>
                      <option value="private">Sembunyikan</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-amber-900">Online di Study Room</span>
                    <select value={studyRoomPresenceVisibility} onChange={(event) => setStudyRoomPresenceVisibility(event.target.value as 'members' | 'private')} className="focus-ring w-full rounded-2xl border border-amber-200 bg-white px-3 py-2.5 text-sm">
                      <option value="members">Tampil ke member room</option>
                      <option value="private">Sembunyikan</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-amber-900">Chat pribadi</span>
                    <select value={dmPrivacy} onChange={(event) => setDmPrivacy(event.target.value as 'friends' | 'none')} className="focus-ring w-full rounded-2xl border border-amber-200 bg-white px-3 py-2.5 text-sm">
                      <option value="friends">Teman bisa chat</option>
                      <option value="none">Matikan chat pribadi</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>
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
