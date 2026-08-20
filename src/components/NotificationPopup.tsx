'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getNotificationMeta } from '@/lib/notifications/type-meta'

/**
 * Popup notifikasi in-app — muncul real-time begitu ada baris baru masuk ke
 * tabel `notifications` milik user yang lagi login (reminder deadline, chat,
 * dsb), tanpa perlu reload halaman. Beda dari Web Push (yang jalan walau
 * app ditutup): ini khusus buat pas user LAGI BUKA app-nya, biar nggak
 * ketinggalan info walau nggak lagi ngecek bell icon.
 *
 * Desain: mobile-first (full-width, gampang di-swipe kayak notifikasi
 * bawaan HP), auto-collapse ke pojok kanan-atas di layar lebar, progress
 * bar auto-dismiss, tap buat buka link, maksimal 3 kartu keliatan sekaligus
 * biar nggak numpuk nutupin layar.
 *
 * Mount SEKALI di level layout (lihat src/app/dashboard/layout.tsx).
 */

const AUTO_DISMISS_MS = 7000
const MAX_VISIBLE = 3
const SWIPE_DISMISS_PX = 90

type ToastItem = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  createdAt: number
}

function ToastCard({
  item,
  onDismiss,
  onOpen,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
  onOpen: (item: ToastItem) => void
}) {
  const meta = getNotificationMeta(item.type)
  const Icon = meta.icon
  const [leaving, setLeaving] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [progress, setProgress] = useState(100)
  const dragging = useRef(false)
  const startX = useRef(0)

  const requestDismiss = useCallback(() => {
    setLeaving(true)
    window.setTimeout(() => onDismiss(item.id), 180)
  }, [item.id, onDismiss])

  useEffect(() => {
    const start = Date.now()
    const timer = window.setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / AUTO_DISMISS_MS) * 100)
      setProgress(pct)
      if (pct <= 0) window.clearInterval(timer)
    }, 100)
    const dismissTimer = window.setTimeout(requestDismiss, AUTO_DISMISS_MS)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(dismissTimer)
    }
  }, [requestDismiss])

  function onTouchStart(event: React.TouchEvent) {
    dragging.current = true
    startX.current = event.touches[0].clientX
  }
  function onTouchMove(event: React.TouchEvent) {
    if (!dragging.current) return
    setDragX(event.touches[0].clientX - startX.current)
  }
  function onTouchEnd() {
    dragging.current = false
    if (Math.abs(dragX) > SWIPE_DISMISS_PX) {
      requestDismiss()
    } else {
      setDragX(0)
    }
  }

  return (
    <div
      role="status"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateX(${dragX}px)`,
        opacity: leaving ? 0 : Math.max(0, 1 - Math.abs(dragX) / 220),
        transition: dragging.current ? 'none' : 'transform 200ms ease, opacity 200ms ease',
      }}
      className={`nexa-toast-in pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-2xl shadow-slate-950/10 backdrop-blur-sm sm:w-96 ${leaving ? 'nexa-toast-out' : ''}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${meta.accent}`} />

      <button
        type="button"
        onClick={() => onOpen(item)}
        className="flex min-w-0 flex-1 items-start gap-3 pl-1.5 text-left"
      >
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${meta.iconBg} ${meta.iconColor}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-slate-950">{item.title}</span>
          {item.message && (
            <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-slate-500">{item.message}</span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={requestDismiss}
        aria-label="Tutup notifikasi"
        className="flex-none rounded-lg p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-100">
        <span className={`block h-full ${meta.accent} opacity-60`} style={{ width: `${progress}%`, transition: 'width 100ms linear' }} />
      </span>
    </div>
  )
}

export default function NotificationPopup() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const supabase = useRef(createClient()).current
  const router = useRouter()

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  async function open(item: ToastItem) {
    dismiss(item.id)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [item.id] }),
    }).catch(() => null)
    if (item.link) router.push(item.link)
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) return

      channel = supabase
        .channel('notifications-popup')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => {
            const row = payload.new as {
              id: string
              type: string
              title: string
              message: string | null
              link: string | null
            }

            setToasts((current) => {
              // Getar halus kalau device support — sentuhan "kayak app besar", tapi jangan sampai error kalau tidak didukung.
              try {
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(30)
              } catch { /* no-op */ }

              const next: ToastItem = {
                id: row.id,
                type: row.type,
                title: row.title,
                message: row.message,
                link: row.link,
                createdAt: Date.now(),
              }
              return [next, ...current].slice(0, MAX_VISIBLE)
            })
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) void supabase.removeChannel(channel)
    }
  }, [supabase])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:left-auto"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} item={toast} onDismiss={dismiss} onOpen={open} />
      ))}
    </div>
  )
}
