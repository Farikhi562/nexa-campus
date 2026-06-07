'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Check, Loader2, Search, UserPlus, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { FeaturedBadgePin } from '@/components/BadgeChip'
import type { FriendRequest, PublicProfile } from '@/types'

function UserCard({ user, action }: { user: PublicProfile; action: ReactNode }) {
  const init = (user.full_name ?? 'N').slice(0, 1).toUpperCase()
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-base font-black text-slate-600">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : init}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-black text-slate-950">{user.full_name ?? 'Mahasiswa NEXA'}</p>
            <FeaturedBadgePin badgeId={user.featured_badge} />
          </div>
          <p className="truncate text-xs text-slate-500">{[user.campus_name, user.major].filter(Boolean).join(' · ')}</p>
          {user.nexa_id && <p className="text-[10px] font-bold text-slate-400">#{user.nexa_id}</p>}
        </div>
        {action}
      </CardContent>
    </Card>
  )
}

export default function FriendsView() {
  const [q, setQ] = useState('')
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [friends, setFriends] = useState<FriendRequest[]>([])
  const [sent, setSent] = useState<FriendRequest[]>([])
  const [received, setReceived] = useState<FriendRequest[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true)
    const res = await fetch('/api/friends', { cache: 'no-store' })
    const json = await res.json()
    if (res.ok) {
      setFriends(json.friends ?? [])
      setSent(json.sent ?? [])
      setReceived(json.received ?? [])
    }
    setLoadingFriends(false)
  }, [])

  useEffect(() => { void loadFriends() }, [loadFriends])

  useEffect(() => {
    if (!q.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const json = await res.json()
      setSearchResults(res.ok ? (json.data ?? []) : [])
      setSearching(false)
    }, 350)
    return () => clearTimeout(timer)
  }, [q])

  const sentIds = new Set(sent.map((r) => r.receiver_id))
  const friendIds = new Set([
    ...friends.map((r) => r.receiver_id),
    ...friends.map((r) => r.requester_id),
  ])

  async function sendRequest(receiverId: string) {
    setActionId(receiverId)
    const res = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiver_id: receiverId }),
    })
    if (res.ok) await loadFriends()
    setActionId(null)
  }

  async function respond(requestId: string, action: 'accept' | 'reject') {
    setActionId(requestId)
    await fetch(`/api/friends/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await loadFriends()
    setActionId(null)
  }

  async function cancelRequest(requestId: string) {
    setActionId(requestId)
    await fetch(`/api/friends/${requestId}`, { method: 'DELETE' })
    await loadFriends()
    setActionId(null)
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.26),transparent_18rem)]" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
            <UserPlus className="h-3.5 w-3.5" />
            Cari Teman
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Belajar lebih seru bareng teman.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Temukan mahasiswa lain, add sebagai teman, dan belajar bareng di Study Room.
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, kampus, atau ketik Nexa ID 6 angka..."
          className="focus-ring w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm"
        />
        {searching && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>

      {/* Search results */}
      {q.trim() && (
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Hasil pencarian</p>
          {searchResults.length === 0 && !searching ? (
            <Card><CardContent className="p-5 text-center text-sm text-slate-500">
              Belum nemu teman. Tenang, ini fitur pencarian, bukan ramalan sosial.
            </CardContent></Card>
          ) : (
            searchResults.map((user) => {
              const isFriend = friendIds.has(user.id)
              const isPending = sentIds.has(user.id)
              return (
                <UserCard
                  key={user.id}
                  user={user}
                  
                  action={
                    isFriend ? (
                      <Badge tone="success">Teman</Badge>
                    ) : isPending ? (
                      <Badge tone="neutral">Terkirim</Badge>
                    ) : (
                      <button
                        onClick={() => sendRequest(user.id)}
                        disabled={actionId === user.id}
                        className="focus-ring inline-flex items-center gap-1.5 rounded-2xl bg-teal-400 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-teal-300 disabled:opacity-50"
                      >
                        {actionId === user.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                        Add
                      </button>
                    )
                  }
                />
              )
            })
          )}
        </div>
      )}

      {loadingFriends ? (
        <div className="flex items-center justify-center p-8 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <>
          {/* Incoming requests */}
          {received.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Permintaan masuk <span className="ml-1 rounded-full bg-teal-100 px-2 py-0.5 text-teal-700">{received.length}</span>
              </p>
              {received.map((req) => req.other_user && (
                <UserCard
                  key={req.id}
                  user={req.other_user}
                  
                  action={
                    <div className="flex gap-2">
                      <button onClick={() => respond(req.id, 'accept')} disabled={actionId === req.id}
                        className="focus-ring flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50">
                        {actionId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                      <button onClick={() => respond(req.id, 'reject')} disabled={actionId === req.id}
                        className="focus-ring flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {/* Friends */}
          {friends.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Teman saya ({friends.length})</p>
              {friends.map((req) => req.other_user && (
                <UserCard key={req.id} user={req.other_user}  action={<Badge tone="success">Teman</Badge>} />
              ))}
            </div>
          )}

          {/* Sent requests */}
          {sent.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Permintaan terkirim</p>
              {sent.map((req) => req.other_user && (
                <UserCard
                  key={req.id}
                  user={req.other_user}
                  
                  action={
                    <button onClick={() => cancelRequest(req.id)} disabled={actionId === req.id}
                      className="focus-ring inline-flex items-center gap-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                      {actionId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Batalkan
                    </button>
                  }
                />
              ))}
            </div>
          )}

          {!q.trim() && friends.length === 0 && sent.length === 0 && received.length === 0 && (
            <Card><CardContent className="py-10 text-center text-sm text-slate-500">
              Belum ada teman. Cari nama atau kampus teman di atas.
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  )
}
