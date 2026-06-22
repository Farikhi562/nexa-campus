import Link from 'next/link'
import ProfileSettingsForm from '@/components/ProfileSettingsForm'
import SkillEvidenceForm from '@/components/verification/SkillEvidenceForm'
import VerificationProgressCard from '@/components/verification/VerificationProgressCard'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import type { Profile } from '@/types'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Verifikasi hanya ditampilkan untuk Pulse/Command — Radar user belum
  // bisa memenuhi syarat (butuh aktifitas Arena dll) tapi tetap ditampilkan
  // biar mereka tahu progress-nya dan termotivasi.
  const plan = getEffectivePlan({ ...(profile ?? {}), email: user!.email })
  const showVerification = plan !== 'radar'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Profile Settings</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Edit profil</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Ubah identitas kampus, foto, deskripsi publik/privat, skill, minat, link portfolio, dan badge yang tampil di profil publik.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          Kembali ke Settings
        </Link>
      </div>

      <ProfileSettingsForm profile={profile as Profile} />

      {/* Bukti Skill & Verifikasi — komponen client yang fetch data sendiri */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-black text-slate-950">Bukti Skill &amp; Verifikasi</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Lampirkan bukti skill kamu (link GitHub, portfolio, sertifikat) dan ajukan verifikasi
            akun kalau semua syarat sudah terpenuhi. Centang biru &ldquo;Verified by NEXA&rdquo; akan
            muncul di profil publikmu dan meningkatkan kepercayaan owner lomba di Arena.
          </p>
        </div>
        <SkillEvidenceForm />
        <VerificationProgressCard />
      </div>
    </div>
  )
}
