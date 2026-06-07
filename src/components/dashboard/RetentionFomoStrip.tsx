import Link from 'next/link'
import { Crown, Flame, Gift, Sparkles, Trophy } from 'lucide-react'
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
  const referralLabel = referralCount >= 25 ? 'NEXA Origin sudah kebuka' : `${remainingReferral} referral lagi menuju milestone`

  return (
    <Card className="overflow-hidden border-amber-100 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white shadow-2xl shadow-slate-900/20">
      <CardContent className="relative p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-28 w-28 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="warning" className="bg-amber-300/15 text-amber-100 ring-amber-200/20">Social Trust Layer</Badge>
              <Badge tone="info" className="bg-cyan-300/15 text-cyan-100 ring-cyan-200/20">v1.5.23 patch</Badge>
            </div>
            <h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
              Kejar badge langka sebelum profil temanmu kelihatan lebih niat dari profilmu.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              NEXA sekarang main di progress, referral, rarity, dan public profile. Masih sehat kok, cuma otak manusia memang gampang dikasih progress bar. Tragis tapi berguna.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
            <Link href="/dashboard/achievements" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-amber-100"><Crown className="h-4 w-4" /><span className="text-xs font-black uppercase">1 Rarest</span></div>
              <p className="mt-1 text-sm font-black text-white">NEXA Origin</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">Badge terlangka, animasi aktif.</p>
            </Link>
            <Link href="/dashboard/achievements" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-fuchsia-100"><Sparkles className="h-4 w-4" /><span className="text-xs font-black uppercase">8 Epic</span></div>
              <p className="mt-1 text-sm font-black text-white">Badge yang layak dipamerin</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">Epic dibuat terbatas, bukan dibagi kayak brosur.</p>
            </Link>
            <Link href="/dashboard" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-orange-100"><Flame className="h-4 w-4" /><span className="text-xs font-black uppercase">Hari ini</span></div>
              <p className="mt-1 text-sm font-black text-white">{todayActiveCount > 0 ? `${todayActiveCount} deadline aktif` : 'Daily Pulse aman dulu'}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">{highPriorityCount > 0 ? `${highPriorityCount} prioritas tinggi perlu dilihat.` : 'Jangan putus streak cuma karena lupa buka app.'}</p>
            </Link>
            <Link href="/dashboard#referral" className="group rounded-2xl border border-white/10 bg-white/10 p-3 transition hover:-translate-y-0.5 hover:bg-white/15">
              <div className="flex items-center gap-2 text-teal-100"><Gift className="h-4 w-4" /><span className="text-xs font-black uppercase">Referral</span></div>
              <p className="mt-1 text-sm font-black text-white">{referralLabel}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-300">Plan kamu: {userTier.toUpperCase()} · reward Pulse otomatis.</p>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
