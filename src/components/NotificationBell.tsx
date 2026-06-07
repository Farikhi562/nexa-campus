'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, BellRing, Check, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`
  return `${Math.floor(diff / 86400)}h lalu`
}

const typeIcon: Record<string, string> = {
  deadline_reminder: '🔔',
  deadline_approaching: '⏰',
  friend_request: '👋',
  friend_accepted: '🤝',
  room_approved: '🚪',
  achievement: '🏆',
  arena_application: '⚔️',
  arena_application_accepted: '✅',
  arena_application_rejected: '🛡️',
  system: '📣',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

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

    // Realtime subscription untuk notifikasi baru
    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => { void loadNotifications() })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [loadNotifications, supabase])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) void loadNotifications() }}
        aria-label="Notifikasi"
        className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-teal-600" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[70] w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-black text-slate-950">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-teal-600 hover:bg-teal-50"
                >
                  <Check className="h-3 w-3" /> Tandai semua
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">Memuat...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-500">Belum ada notifikasi.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => {
                  const content = (
                    <div className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 ${!notif.is_read ? 'bg-teal-50/40' : ''}`}>
                      <span className="mt-0.5 flex-shrink-0 text-lg">{typeIcon[notif.type] ?? '📣'}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-5 ${!notif.is_read ? 'font-black text-slate-950' : 'font-bold text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="mt-0.5 text-xs leading-4 text-slate-500 line-clamp-2">{notif.message}</p>
                        )}
                        <p className="mt-1 text-[10px] font-bold text-slate-400">{timeAgo(notif.created_at)}</p>
                      </div>
                      {!notif.is_read && <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-teal-500" />}
                    </div>
                  )
                  return notif.link ? (
                    <Link key={notif.id} href={notif.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notif.id}>{content}</div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
