'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, Filter, Loader2, MessageCircle, RefreshCcw } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

const filters = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum dibaca' },
  { key: 'direct_message', label: 'Chat' },
  { key: 'friend_request', label: 'Teman' },
  { key: 'arena', label: 'Arena' },
  { key: 'achievement', label: 'Badge' },
  { key: 'deadline', label: 'Deadline' },
] as const

type FilterKey = (typeof filters)[number]['key']

const icons: Record<string, string> = {
  direct_message: '💬', friend_request: '👋', friend_accepted: '🤝',
  arena_application: '⚔️', arena_application_accepted: '✅', arena_application_rejected: '🛡️',
  badge_unlocked: '🏆', achievement: '🏆', deadline_reminder: '⏰', deadline_approaching: '🔔', system: '📣',
}

function timeAgo(value: string) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (diff < 60) return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

function matchesFilter(item: NotificationItem, filter: FilterKey) {
  if (filter === 'all') return true
  if (filter === 'unread') return !item.is_read
  if (filter === 'arena') return item.type.startsWith('arena_')
  if (filter === 'deadline') return item.type.startsWith('deadline_')
  return item.type === filter
}

export default function NotificationCenterView() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=80', { cache: 'no-store' })
      const json = await res.json()
      setItems(res.ok ? (json.data ?? []) : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [items, filter])
  const unreadCount = items.filter((item) => !item.is_read).length

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
  }

  async function markOneRead(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.25),transparent_18rem)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
              <Bell className="h-3.5 w-3.5" /> Notification Center
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Inbox aktivitas NEXA.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Chat, friend request, Arena, badge, dan deadline masuk ke satu tempat. Akhirnya lonceng notif punya pekerjaan tetap.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={load} variant="outline" className="rounded-2xl bg-white/10 text-white hover:bg-white/15">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllRead} className="rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300">
                <CheckCheck className="h-4 w-4" /> Tandai semua
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`flex-shrink-0 rounded-2xl px-3 py-2 text-xs font-black transition ${filter === item.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Filter className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="font-black text-slate-950">Belum ada notifikasi di filter ini.</p>
              <p className="mt-1 text-sm text-slate-500">Belum ada notifikasi yang bisa ditampilkan saat ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const content = (
                  <div className={`flex gap-3 p-4 transition hover:bg-slate-50 ${!item.is_read ? 'bg-teal-50/50' : 'bg-white'}`}>
                    <span className="mt-0.5 text-xl">{icons[item.type] ?? '📣'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950">{item.title}</p>
                        {!item.is_read && <Badge tone="success">Baru</Badge>}
                      </div>
                      {item.message && <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>}
                      <p className="mt-2 text-xs font-bold text-slate-400">{timeAgo(item.created_at)}</p>
                    </div>
                    {item.link && <MessageCircle className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300" />}
                  </div>
                )
                return item.link ? (
                  <Link key={item.id} href={item.link} onClick={() => void markOneRead(item.id)}>{content}</Link>
                ) : (
                  <button key={item.id} onClick={() => void markOneRead(item.id)} className="block w-full text-left">{content}</button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
