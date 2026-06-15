'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2, MessageCircle, Sparkles, UserPlus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import FounderVerifiedBadge from '@/components/FounderVerifiedBadge'
import { FeaturedBadgePin } from '@/components/BadgeChip'

type Suggestion = {
  id: string
  full_name: string | null
  avatar_url: string | null
  campus_name: string | null
  major: string | null
  nexa_id: string | null
  featured_badge?: string | null
  founder_verified?: boolean | null
  reason: string
  score: number
  status?: 'none' | 'pending' | 'friend'
}

function initials(name?: string | null) {
  const parts = (name || 'N').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'N'
}

export default function FriendSuggestionsCard({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/friends/suggestions', { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    setItems(res.ok ? (json.data ?? []) : [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function addFriend(id: string) {
    setBusyId(id)
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: id }),
    })
    if (res.ok) setItems((current) => current.map((item) => item.id === id ? { ...item, status: 'pending' } : item))
    setBusyId(null)
  }

  if (loading) {
    return <Card><CardContent className="flex h-32 items-center justify-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>
  }

  if (items.length === 0) return null

  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/60">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-700">
              <Sparkles className="h-3.5 w-3.5" /> Rekomendasi teman
            </div>
            <h2 className="font-black text-slate-950">Cocok buat diajak belajar</h2>
            <p className="text-xs leading-5 text-slate-500">Diprioritaskan dari kampus, jurusan, aktivitas, dan skill supaya rekomendasinya lebih relevan.</p>
          </div>
          {!compact && <Link href="/dashboard/friends" className="text-xs font-black text-teal-700 hover:underline">Cari lagi</Link>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.slice(0, compact ? 4 : 8).map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-white bg-white/85 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/dashboard/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-xs font-black text-slate-600">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(user.full_name)}
                </span>
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-1 truncate text-sm font-black text-slate-950">
                    <span className="truncate">{user.full_name || 'Mahasiswa NEXA'}</span>
                    <FounderVerifiedBadge founderVerified={user.founder_verified} compact />
                    <FeaturedBadgePin badgeId={user.featured_badge} />
                  </p>
                  <p className="truncate text-[11px] text-slate-500">{[user.campus_name, user.major].filter(Boolean).join(' · ')}</p>
                  <p className="mt-1 text-[10px] font-black text-teal-700">{user.reason}</p>
                </div>
              </Link>
              <div className="flex w-full justify-stretch sm:w-auto sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
                {user.status === 'friend' ? (
                  <Link href={`/dashboard/messages/${user.id}`} className="flex h-9 w-full items-center justify-center rounded-2xl bg-teal-100 text-teal-700 hover:bg-teal-200 sm:w-9"><MessageCircle className="h-4 w-4" /></Link>
                ) : user.status === 'pending' ? (
                  <Badge tone="neutral">Pending</Badge>
                ) : (
                  <Button onClick={() => addFriend(user.id)} disabled={busyId === user.id} className="h-9 min-h-9 rounded-2xl px-3">
                    {busyId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
