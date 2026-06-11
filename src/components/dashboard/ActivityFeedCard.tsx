'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Flame, Loader2, Sparkles, Trophy, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import SmartEmptyState from '@/components/dashboard/SmartEmptyState'

type FeedItem = {
  id: string
  type: string
  title: string
  description: string
  created_at: string
  points?: number | null
  actor?: {
    id: string
    name: string | null
    avatar_url?: string | null
    nexa_id?: string | null
  } | null
}

type FeedResponse = {
  data?: FeedItem[]
  error?: string
}

function iconFor(type: string) {
  if (type.includes('deadline')) return CheckCircle2
  if (type.includes('leaderboard') || type.includes('champion')) return Trophy
  if (type.includes('arena') || type.includes('team')) return Users
  if (type.includes('daily') || type.includes('streak')) return Flame
  return Sparkles
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'baru saja'
  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return 'baru saja'
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))} menit lalu`
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))} jam lalu`
  return `${Math.max(1, Math.floor(diff / day))} hari lalu`
}

export default function ActivityFeedCard() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/activity-feed', { cache: 'no-store' })
        const json = (await res.json().catch(() => null)) as FeedResponse | null
        if (!active) return
        if (!res.ok) {
          setError(json?.error ?? 'Activity feed gagal dimuat.')
          return
        }
        setItems(json?.data ?? [])
      } catch {
        if (active) setError('Activity feed gagal dimuat.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="border-b border-slate-100 bg-white/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-violet-700">
                <Sparkles className="h-3.5 w-3.5" />
                Activity Feed
              </div>
              <h3 className="mt-3 text-lg font-black text-slate-950">Kampus lagi bergerak.</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Aktivitas kecil yang membuat progres belajar dan kolaborasi lebih mudah terlihat.
              </p>
            </div>
            <Link href="/dashboard/leaderboard" className="hidden items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 sm:inline-flex">
              Leaderboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex animate-pulse gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-5 text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <SmartEmptyState kind="activity" compact />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.slice(0, 6).map((item) => {
              const Icon = iconFor(item.type)
              return (
                <div key={item.id} className="flex gap-3 p-4 transition hover:bg-slate-50/80 sm:p-5">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
                    {item.actor?.avatar_url ? (
                      <img src={item.actor.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-950">{item.title}</p>
                      {item.points ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">+{item.points} pts</span> : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{formatTime(item.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
