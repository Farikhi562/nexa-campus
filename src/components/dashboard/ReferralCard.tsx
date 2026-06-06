'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Gift, LockKeyhole, MessageCircle } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import type { Plan } from '@/types'

const SITE_URL = 'https://campus.nexatechlabs.my.id'

export default function ReferralCard({
  referralCode,
  referralCount,
  userTier,
}: {
  referralCode?: string | null
  referralCount: number
  userTier: Plan
}) {
  const [copied, setCopied] = useState(false)

  const referralLink = useMemo(() => {
    if (!referralCode) return ''
    return `${SITE_URL}/login?mode=signup&ref=${encodeURIComponent(referralCode)}`
  }, [referralCode])

  const shareText = `Eh coba NEXA Campus, buat nyimpen deadline tugas/praktikum biar gak lupa. Gratis: ${referralLink}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  async function copyLink() {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Gift className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-950">Ajak Teman</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Bagikan NEXA. Setelah teman selesai onboarding, kamu dapat 30 hari Pulse gratis.
            </p>
          </div>
          <Badge tone={userTier === 'radar' ? 'info' : 'brand'}>{userTier.toUpperCase()}</Badge>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Referral link</p>
          {referralLink ? (
            <p className="mt-2 break-all text-sm font-bold leading-6 text-slate-800">
              {referralLink}
            </p>
          ) : (
            <div className="mt-2 flex gap-2 text-sm leading-6 text-slate-500">
              <LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0" />
              Kode referral belum tersedia. Jalankan migration referral dulu.
            </div>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50 p-3 text-sm font-bold text-teal-900">
          {referralCount} teman sudah join pakai kode kamu.
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={copyLink}
            disabled={!referralLink}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Tersalin' : 'Copy Link'}
          </button>
          <a
            href={referralLink ? whatsappUrl : undefined}
            className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-black text-white transition ${
              referralLink
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'pointer-events-none bg-slate-300'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Share WA
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
