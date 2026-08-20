'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, CheckCircle2, Clock3, ExternalLink, Filter, Loader2, PlayCircle, RefreshCcw, Trash2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { typeIcon as icons } from '@/lib/notifications/type-meta'

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
  related_deadline_id?: string | null
  action_state?: string | null
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

function deadlineIdFrom(item: NotificationItem) {
  if (item.related_deadline_id) return item.related_deadline_id
  const link = item.link ?? ''
  return link.match(/[?&]deadline=([0-9a-f-]{36})/i)?.[1]
    ?? link.match(/\/deadlines\/([0-9a-f-]{36})(?:\/|$)/i)?.[1]
    ?? null
}

export default function NotificationCenterView() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }),
    })
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
  }

  async function markOneRead(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item))
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [id] }),
    })
  }

  async function deleteOne(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
    setMessage('Notifikasi dihapus.')
    await fetch('/api/notifications', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
  }

  async function deleteAll() {
    if (items.length === 0) return
    if (!window.confirm('Hapus semua notifikasi? Tindakan ini tidak bisa dibatalkan.')) return
    setItems([])
    setMessage('Semua notifikasi dihapus.')
    await fetch('/api/notifications', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }),
    })
  }

  async function runAction(item: NotificationItem, action: 'mark_done' | 'snooze') {
    setBusyId(item.id)
    setMessage('')
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action, minutes: 60 }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Aksi notifikasi gagal.')
      setItems((current) => current.filter((row) => row.id !== item.id))
      setMessage(action === 'mark_done' ? 'Deadline ditandai selesai.' : 'Notifikasi ditunda 1 jam.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Aksi notifikasi gagal.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(96,165,250,0.25),transparent_18rem)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-xs font-black text-blue-100">
              <Bell className="h-3.5 w-3.5" /> Notification Center
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Notif yang bisa langsung dikerjain.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Deadline bisa langsung diselesaikan, dibawa ke Focus Mode, atau ditunda. Bukan cuma teriak lalu menghilang seperti panitia grup WA.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={load} variant="outline" className="rounded-2xl bg-white/10 text-white hover:bg-white/15">
              <RefreshCcw className="h-4 w-4" /> Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllRead} className="rounded-2xl bg-blue-400 text-slate-950 hover:bg-blue-300">
                <CheckCheck className="h-4 w-4" /> Tandai semua
              </Button>
            )}
            {items.length > 0 && (
              <Button onClick={deleteAll} variant="outline" className="rounded-2xl border-red-300/30 bg-red-500/10 text-red-200 hover:bg-red-500/20">
                <Trash2 className="h-4 w-4" /> Hapus semua
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button key={item.key} onClick={() => setFilter(item.key)} className={`flex-shrink-0 rounded-2xl px-3 py-2 text-xs font-black transition ${filter === item.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {message && <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">{message}</div>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <Filter className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="font-black text-slate-950">Belum ada notifikasi di filter ini.</p>
              <p className="mt-1 text-sm text-slate-500">Inbox bersih. Kejadian langka, nikmati sebentar.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => {
                const isDeadline = item.type.startsWith('deadline_')
                const deadlineId = deadlineIdFrom(item)
                const focusLink = deadlineId ? `/dashboard/focus?deadline=${deadlineId}` : '/dashboard/focus'
                return (
                  <div key={item.id} className={`flex gap-3 p-4 transition hover:bg-slate-50 ${!item.is_read ? 'bg-blue-50/50' : 'bg-white'}`}>
                    <span className="mt-0.5 text-xl">{icons[item.type] ?? '📣'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950">{item.title}</p>
                        {!item.is_read && <Badge tone="success">Baru</Badge>}
                      </div>
                      {item.message && <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>}
                      <p className="mt-2 text-xs font-bold text-slate-400">{timeAgo(item.created_at)}</p>

                      {isDeadline ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" disabled={busyId === item.id} onClick={() => void runAction(item, 'mark_done')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-50">
                            {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Selesai
                          </button>
                          <Link href={focusLink} onClick={() => void markOneRead(item.id)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800">
                            <PlayCircle className="h-3.5 w-3.5" /> Fokus
                          </Link>
                          <button type="button" disabled={busyId === item.id} onClick={() => void runAction(item, 'snooze')} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                            <Clock3 className="h-3.5 w-3.5" /> 1 jam lagi
                          </button>
                          {item.link && (
                            <Link href={item.link} onClick={() => void markOneRead(item.id)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50">
                              <ExternalLink className="h-3.5 w-3.5" /> Buka
                            </Link>
                          )}
                        </div>
                      ) : item.link ? (
                        <Link href={item.link} onClick={() => void markOneRead(item.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-blue-700 hover:underline">
                          Buka detail <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <button type="button" onClick={() => void markOneRead(item.id)} className="mt-3 text-xs font-black text-blue-700 hover:underline">Tandai dibaca</button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteOne(item.id)}
                      aria-label="Hapus notifikasi"
                      className="flex-shrink-0 self-start rounded-xl p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
