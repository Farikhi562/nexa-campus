'use client'

import { useState } from 'react'
import { CheckCircle2, PartyPopper, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types'

type Step = 'welcome' | 'profile' | 'upload' | 'done'

export default function OnboardingOverlay({
  profile,
  onComplete,
}: {
  profile: Profile
  onComplete: () => void
}) {
  const needsProfile = !profile.jurusan || !profile.universitas || !profile.provinsi
  const [step, setStep] = useState<Step>('welcome')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    jurusan: profile.jurusan ?? '',
    universitas: profile.universitas ?? '',
    provinsi: profile.provinsi ?? '',
  })

  async function complete() {
    setSaving(true)

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        onboarding_completed: true,
      }),
    })

    setSaving(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      alert(data.error || 'Gagal menyelesaikan onboarding.')
      return
    }

    onComplete()
  }

  async function saveProfile() {
    setSaving(true)

    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jurusan: form.jurusan.trim(),
        universitas: form.universitas.trim(),
        provinsi: form.provinsi.trim(),
        profile_completed: true,
      }),
    })

    setSaving(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      alert(data.error || 'Gagal menyimpan profil.')
      return
    }

    setStep('upload')
  }

  const firstName = profile.full_name?.split(' ')[0] || 'Mahasiswa'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
        {step === 'done' && (
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                className="absolute h-2 w-2 animate-bounce rounded-full bg-brand-500"
                style={{
                  left: `${10 + (index * 5) % 80}%`,
                  top: `${8 + (index * 11) % 70}%`,
                  animationDelay: `${index * 70}ms`,
                }}
              />
            ))}
          </div>
        )}

        {step === 'welcome' && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-950">Halo {firstName}! Yuk setup akun kamu dulu 🎉</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              NEXA akan bantu bikin materi jadi soal latihan, tracking progres, dan reminder ujian. Setup sebentar saja.
            </p>
            <Button className="mt-6" onClick={() => setStep(needsProfile ? 'profile' : 'upload')}>
              Mulai Setup
            </Button>
          </div>
        )}

        {step === 'profile' && (
          <div>
            <h2 className="text-xl font-black text-slate-950">Lengkapi profil akademik</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Data ini dipakai untuk personalisasi leaderboard, jadwal, dan rekomendasi kampus.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                ['jurusan', 'Jurusan / Program Studi'],
                ['universitas', 'Kampus / Universitas'],
                ['provinsi', 'Provinsi'],
              ].map(([key, label]) => (
                <label key={key} className="text-sm font-semibold text-slate-700">
                  {label}
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              ))}
            </div>
            <Button
              className="mt-5"
              onClick={saveProfile}
              loading={saving}
              disabled={!form.jurusan || !form.universitas || !form.provinsi}
            >
              Simpan & Lanjut
            </Button>
          </div>
        )}

        {step === 'upload' && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Upload className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-950">Upload Dokumen pertamamu</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Upload PDF materi, diktat, atau soal lama. NEXA akan OCR Dokumen itu lalu membuat soal latihan yang bisa langsung dikerjakan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => window.location.assign('/dashboard/upload')}>
                Upload PDF Pertama
              </Button>
              <Button variant="outline" onClick={() => setStep('done')}>
                Nanti dulu
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="relative text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-950">Setup selesai!</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Dashboard kamu sudah siap. Mulai belajar, upload materi, dan pantau progres dari sini.
            </p>
            <Button className="mt-6" onClick={complete} loading={saving}>
              Mulai Belajar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}