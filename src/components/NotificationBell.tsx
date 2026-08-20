'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellRing, Check, CheckCircle2, Clock3, PlayCircle, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { typeIcon } from '@/lib/notifications/type-meta'

type Notification = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
  related_deadline_id?: string | null
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`
  return `${Math.floor(diff / 86400)}h lalu`
}

function deadlineIdFrom(item: Notification) {
  if (item.related_deadline_id) return item.related_deadline_id
  const link = item.link ?? ''
  return link.match(/[?&]deadline=([0-9a-f-]{36})/i)?.[1]
    ?? link.match(/\/deadlines\/([0-9a-f-]{36})(?:\/|$)/i)?.[1]
    ?? null
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) {
        setNotifications(json.data ?? [])
        setUnreadCount(json.unreadCount ?? 0)
      }
    } catch { /* silent fail */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void loadNotifications()
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) return
      channel = supabase
        .channel('notifications-bell')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          () => { void loadNotifications() }
        )
        .subscribe()
    })

    return () => { if (channel) void supabase.removeChannel(channel) }
  }, [loadNotifications, supabase])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
  }

  async function action(item: Notification, actionName: 'snooze' | 'mark_done' | 'start_focus') {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, action: actionName, minutes: 60 }),
    })
    setNotifications((current) => current.filter((row) => row.id !== item.id))
    setUnreadCount((count) => Math.max(0, count - (item.is_read ? 0 : 1)))
  }

  async function deleteOne(item: Notification) {
    setNotifications((current) => current.filter((row) => row.id !== item.id))
    setUnreadCount((count) => Math.max(0, count - (item.is_read ? 0 : 1)))
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    })
  }

  async function deleteAll() {
    if (notifications.length === 0) return
    if (!window.confirm('Hapus semua notifikasi? Tindakan ini tidak bisa dibatalkan.')) return
    setNotifications([])
    setUnreadCount(0)
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => { setOpen((value) => !value); if (!open) void loadNotifications() }} aria-label="Notifikasi" className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100">
        {unreadCount > 0 ? <BellRing className="h-5 w-5 text-blue-600" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-black text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[70] w-96 max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-black text-slate-950">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && <button onClick={markAllRead} className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50"><Check className="h-3 w-3" /> Tandai semua</button>}
              {notifications.length > 0 && <button onClick={deleteAll} className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Hapus semua</button>}
              <button onClick={() => setOpen(false)} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">Memuat...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center"><Bell className="mx-auto mb-2 h-8 w-8 text-slate-200" /><p className="text-sm text-slate-500">Belum ada notifikasi.</p></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((item) => {
                  const deadlineId = deadlineIdFrom(item)
                  const isDeadline = item.type.startsWith('deadline_')
                  return (
                    <div key={item.id} className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 ${!item.is_read ? 'bg-blue-50/40' : ''}`}>
                      <span className="mt-0.5 flex-shrink-0 text-lg">{typeIcon[item.type] ?? '📣'}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-5 ${!item.is_read ? 'font-black text-slate-950' : 'font-bold text-slate-700'}`}>{item.title}</p>
                        {item.message && <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-slate-500">{item.message}</p>}
                        <p className="mt-1 text-[10px] font-bold text-slate-400">{timeAgo(item.created_at)}</p>
                        {isDeadline && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => void action(item, 'mark_done')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[10px] font-black text-white"><CheckCircle2 className="h-3 w-3" /> Selesai</button>
                            <Link href={deadlineId ? `/dashboard/focus?deadline=${deadlineId}` : '/dashboard/focus'} onClick={() => { void action(item, 'start_focus'); setOpen(false) }} className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-2 py-1.5 text-[10px] font-black text-white"><PlayCircle className="h-3 w-3" /> Fokus</Link>
                            <button type="button" onClick={() => void action(item, 'snooze')} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-black text-slate-600"><Clock3 className="h-3 w-3" /> 1 jam</button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                        {!item.is_read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                        <button
                          type="button"
                          onClick={() => void deleteOne(item)}
                          aria-label="Hapus notifikasi"
                          className="rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 p-3">
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-xs font-black text-white hover:bg-slate-800">Buka Notification Center</Link>
          </div>
        </div>
      )}
    </div>
  )
}
