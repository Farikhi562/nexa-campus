'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, UserRoundCog } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

type ProfileCompletion = {
  percent: number
  completed: string[]
  missing: Array<{ key: string; label: string; href: string }>
  nextAction?: { label: string; href: string } | null
}

type ProfileResponse = {
  profile_completion?: ProfileCompletion
  founder_verified?: boolean
}

function clampPercent(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

export default function ProfileCompletionCard() {
  const [data, setData] = useState<ProfileCompletion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/profile/me', { cache: 'no-store' })
        const json = (await res.json().catch(() => null)) as ProfileResponse | null
        if (!active) return
        if (!res.ok || !json?.profile_completion) {
          setError('Progress profil belum bisa dimuat.')
          return
        }
        setData(json.profile_completion)
      } catch {
        if (active) setError('Progress profil gagal dimuat.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const percent = clampPercent(data?.percent)
  const nextAction = data?.nextAction ?? data?.missing?.[0] ?? null
  const ringLabel = useMemo(() => {
    if (percent >= 100) return 'Lengkap'
    if (percent >= 75) return 'Hampir'
    if (percent >= 45) return 'Lumayan'
    return 'Mulai'
  }, [percent])

  return (
    <Card className="overflow-hidden border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-teal-700">
              <UserRoundCog className="h-3.5 w-3.5" />
              Profile Power
            </div>
            <h3 className="mt-3 text-lg font-black text-slate-950">Lengkapi profil biar lebih dipercaya.</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Profil yang rapi bikin orang lebih berani add, invite Study Room, atau approve kamu di Arena. Rupanya manusia butuh konteks sebelum percaya, mengejutkan sekali.
            </p>
          </div>
          <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-3xl border border-teal-200 bg-white text-center shadow-lg shadow-teal-100/70">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            ) : (
              <>
                <span className="text-2xl font-black text-slate-950">{percent}%</span>
                <span className="text-[10px] font-black uppercase tracking-wide text-teal-600">{ringLabel}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-700"
            style={{ width: `${loading ? 30 : percent}%` }}
          />
        </div>

        {error ? (
          <p className="mt-3 text-xs font-bold text-red-600">{error}</p>
        ) : percent >= 100 ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p><span className="font-black">Profil lengkap.</span> Tinggal pamerkan badge terbaik dan jangan merusaknya dengan bio “gabut”.</p>
          </div>
        ) : data?.missing?.length ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {data.missing.slice(0, 4).map((item) => (
                <span key={item.key} className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                  + {item.label}
                </span>
              ))}
            </div>
            {nextAction && (
              <Link
                href={nextAction.href}
                className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                {nextAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : loading ? (
          <div className="mt-4 h-16 animate-pulse rounded-2xl bg-slate-100" />
        ) : null}

        <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Data privat tetap ikut visibility setting. Yang dipoles cuma presentasi publiknya.
        </div>
      </CardContent>
    </Card>
  )
}
