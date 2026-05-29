'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

export default function NotificationBell() {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

  const loadNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    setItems((data ?? []) as Notification[])
  }, [supabase])

  useEffect(() => {
    loadNotifications()
    const timer = setInterval(loadNotifications, 30_000)
    return () => clearInterval(timer)
  }, [loadNotifications])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item))
  }

  async function markAllRead() {
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
  }

  const unread = items.filter((item) => !item.is_read).length

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-brand-950" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-950/35" onClick={() => setOpen(false)} aria-label="Tutup notifikasi" />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-lg font-black text-slate-950">Notifikasi</p>
                <p className="text-xs text-slate-500">{unread} belum dibaca</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50"
                >
                  <CheckCheck className="h-4 w-4" />
                  Tandai semua dibaca
                </button>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  Belum ada notifikasi.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markRead(item.id)}
                      className={`w-full rounded-xl border p-4 text-left transition hover:border-brand-200 ${
                        item.is_read ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            {new Date(item.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                        {!item.is_read && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
