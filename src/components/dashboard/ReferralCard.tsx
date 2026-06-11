'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Gift, LockKeyhole, MessageCircle, Sparkles, Trophy, Users } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import type { Plan } from '@/types'

const SITE_URL = 'https://campus.nexatechlabs.my.id'

function nextReferralTarget(count: number) {
  if (count < 1) return { goal: 1, label: 'badge Pengajak', reward: 'badge biasa + 30 hari Pulse' }
  if (count < 3) return { goal: 3, label: 'Epic Squad Builder', reward: 'badge Epic' }
  if (count < 10) return { goal: 10, label: 'Epic Campus Magnet', reward: 'badge Epic referral' }
  if (count < 25) return { goal: 25, label: 'NEXA Origin', reward: 'badge terlangka + animasi' }
  return { goal: count, label: 'NEXA Origin diamankan', reward: 'kamu sudah di rarity tertinggi' }
}

export default function ReferralCard({
  referralCode,
  referralCount,
  userTier,
  nexaId,
}: {
  referralCode?: string | null
  referralCount: number
  userTier: Plan
  nexaId?: string | null
}) {
  const [copied, setCopied] = useState(false)

  const referralLink = useMemo(() => {
    if (!referralCode) return ''
    return `${SITE_URL}/login?mode=signup&ref=${encodeURIComponent(referralCode)}`
  }, [referralCode])

  const target = nextReferralTarget(referralCount)
  const remaining = Math.max(target.goal - referralCount, 0)
  const progress = target.goal > 0 ? Math.min(100, Math.round((referralCount / target.goal) * 100)) : 100
  const shareText = `Aku pakai NEXA Campus untuk mencatat deadline, Daily Pulse, Study Room, badge, dan leaderboard kampus. Join dari link ini supaya kita sama-sama mendapat reward: ${referralLink}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  async function copyLink() {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Card className="overflow-hidden border-teal-100 bg-gradient-to-br from-white via-teal-50/70 to-amber-50/70">
      <CardContent className="p-0">
        <div className="relative p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-teal-300/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
                <Gift className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-950">Ajak Teman</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Referral sekarang beneran ngasih reward: teman selesai onboarding, kamu dapat 30 hari Pulse + poin + progress badge.
              </p>
            </div>
            <Badge tone={userTier === 'radar' ? 'info' : 'brand'}>{userTier.toUpperCase()}</Badge>
          </div>

          <div className="relative mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Referral link</p>
              {referralLink ? (
                <p className="mt-2 break-all text-sm font-bold leading-6 text-slate-800">{referralLink}</p>
              ) : (
                <div className="mt-2 flex gap-2 text-sm leading-6 text-slate-500">
                  <LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Kode referral belum tersedia. Jalankan SQL referral retention patch dulu.
                </div>
              )}
              {nexaId && <p className="mt-2 text-[11px] font-black text-slate-400">NEXA ID #{nexaId}</p>}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">Target berikutnya</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{target.label}</p>
                </div>
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[10px] font-black text-amber-800">
                  <span>{referralCount}/{target.goal}</span>
                  <span>{remaining > 0 ? `${remaining} lagi` : 'selesai'}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-amber-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p className="mt-2 text-[11px] font-bold leading-4 text-amber-800">Reward: {target.reward}</p>
            </div>
          </div>

          <div className="relative mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3 text-sm font-bold text-teal-900">
              <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {referralCount} teman join</div>
            </div>
            <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-3 text-sm font-bold text-fuchsia-900">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> 8 Epic badge</div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm font-bold text-amber-900">
              <div className="flex items-center gap-2"><Trophy className="h-4 w-4" /> 1 badge terlangka</div>
            </div>
          </div>

          <div className="relative mt-4 grid gap-2 sm:grid-cols-2">
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
                referralLink ? 'bg-emerald-600 hover:bg-emerald-700' : 'pointer-events-none bg-slate-300'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              Share WA
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
