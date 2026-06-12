import Link from 'next/link'
import { Crown, Flame, Gift, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import type { Plan } from '@/types'

export default function RetentionFomoStrip({
  referralCount,
  userTier,
  todayActiveCount,
  highPriorityCount,
}: {
  referralCount: number
  userTier: Plan
  todayActiveCount: number
  highPriorityCount: number
}) {
  const nextReferralGoal = referralCount < 1 ? 1 : referralCount < 3 ? 3 : referralCount < 10 ? 10 : 25
  const remainingReferral = Math.max(nextReferralGoal - referralCount, 0)
  const referralLabel = referralCount >= 25 ? 'Referral kamu sudah kuat' : `${remainingReferral} teman lagi menuju reward berikutnya`

  return (
    <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-900/20">
      <CardContent className="relative p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/60 to-transparent" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning" className="bg-amber-300/15 text-amber-100 ring-amber-200/20">Progress akun</Badge>
              <Badge tone="info" className="bg-cyan-300/15 text-cyan-100 ring-cyan-200/20">Upgrade opsional</Badge>
            </div>
            <h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
              Biar deadline nggak cuma dicatat, tapi beneran kepegang.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Radar cukup buat mulai. Pulse dan Command berguna saat tugas, praktikum, dan urusan kampus mulai datang barengan.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
            <Link href="/dashboard/achievements" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-amber-100"><Crown className="h-4 w-4" /><span className="text-xs font-black uppercase">Profil rapi</span></div>
              <p className="mt-1 text-sm font-black text-white">Tampil lebih jelas</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">Profil lengkap bikin leaderboard dan teman lebih kebaca.</p>
            </Link>
            <Link href="/dashboard/achievements" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-fuchsia-100"><Sparkles className="h-4 w-4" /><span className="text-xs font-black uppercase">Poin & badge</span></div>
              <p className="mt-1 text-sm font-black text-white">Progres kelihatan</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">Selesai deadline tepat waktu tetap terasa ada hasilnya.</p>
            </Link>
            <Link href="/dashboard" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-orange-100"><Flame className="h-4 w-4" /><span className="text-xs font-black uppercase">Hari ini</span></div>
              <p className="mt-1 text-sm font-black text-white">{todayActiveCount > 0 ? `${todayActiveCount} deadline aktif` : 'Cek Daily Pulse dulu'}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">{highPriorityCount > 0 ? `${highPriorityCount} prioritas tinggi perlu dilihat.` : 'Jaga ritme dengan check-in harian.'}</p>
            </Link>
            <Link href="/dashboard#referral" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-teal-100"><Gift className="h-4 w-4" /><span className="text-xs font-black uppercase">Referral</span></div>
              <p className="mt-1 text-sm font-black text-white">{referralLabel}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">Paket kamu: {userTier.toUpperCase()}. Reward aktif setelah syarat terpenuhi.</p>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
