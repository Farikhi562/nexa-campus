'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Loader2, Trash2 } from 'lucide-react'
import { getNotificationMeta } from '@/lib/notifications/type-meta'

/**
 * Gesture "tarik ke bawah dari atas layar" buat buka panel notifikasi —
 * kayak narik status bar HP buat lihat notification shade. Cuma aktif kalau
 * halaman lagi di posisi paling atas (scrollY 0), jadi nggak bentrok sama
 * scroll biasa.
 *
 * Mount SEKALI di level layout (lihat src/app/dashboard/layout.tsx).
 */

type Item = {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

const PULL_THRESHOLD = 90
const MAX_PULL = 260
const PANEL_OPEN_HEIGHT = 420

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`
  return `${Math.floor(diff / 86400)}h lalu`
}

export default function PullToRevealNotifications() {
  const [pull, setPull] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const dragging = useRef(false)
  const engaged = useRef(false)
  const startY = useRef(0)
  const closingBySwipe = useRef(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (res.ok) setItems(json?.data ?? [])
    } catch { /* silent fail */ }
    finally { setLoading(false); setFetched(true) }
  }, [])

  const closePanel = useCallback(() => {
    setOpen(false)
    setPull(0)
  }, [])

  async function deleteOne(id: string) {
    setItems((current) => current.filter((i) => i.id !== id))
    await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => null)
  }

  useEffect(() => {
    function onTouchStart(event: TouchEvent) {
      if (open) return // panel udah kebuka, biar swipe-up-nya yang urus (lihat handler panel)
      if (window.scrollY > 2) return
      dragging.current = true
      engaged.current = false
      startY.current = event.touches[0].clientY
    }

    function onTouchMove(event: TouchEvent) {
      if (!dragging.current) return
      const delta = event.touches[0].clientY - startY.current
      if (delta <= 0) return

      if (!engaged.current) {
        if (delta < 10) return // ambang kecil biar nggak kepicu tap/scroll halus
        engaged.current = true
        if (!fetched) void loadItems()
      }

      event.preventDefault()
      setPull(Math.min(MAX_PULL, delta * 0.55))
    }

    function onTouchEnd() {
      if (!dragging.current) return
      dragging.current = false
      if (!engaged.current) return
      engaged.current = false

      if (pull > PULL_THRESHOLD) {
        setOpen(true)
        setPull(PANEL_OPEN_HEIGHT)
      } else {
        setPull(0)
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pull, fetched])

  // Swipe-up di panel yang udah kebuka buat nutup lagi.
  function onPanelTouchStart(event: React.TouchEvent) {
    closingBySwipe.current = true
    startY.current = event.touches[0].clientY
  }
  function onPanelTouchMove(event: React.TouchEvent) {
    if (!closingBySwipe.current) return
    const delta = event.touches[0].clientY - startY.current
    if (delta < 0) setPull(Math.max(0, PANEL_OPEN_HEIGHT + delta))
  }
  function onPanelTouchEnd(event: React.TouchEvent) {
    closingBySwipe.current = false
    const delta = event.changedTouches[0].clientY - startY.current
    if (delta < -60) closePanel()
    else setPull(PANEL_OPEN_HEIGHT)
  }

  const progress = Math.min(1, pull / PULL_THRESHOLD)
  const showIndicator = pull > 0 && !open

  return (
    <>
      {/* Indikator kecil pas lagi ditarik, sebelum kebuka penuh */}
      {showIndicator && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[65] flex justify-center"
          style={{ transform: `translateY(${Math.min(pull, 72) - 40}px)`, opacity: progress }}
        >
          <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown
                className="h-4 w-4 transition-transform"
                style={{ transform: `rotate(${progress * 180}deg)` }}
              />
            )}
          </div>
        </div>
      )}

      {/* Scrim gelap di belakang panel */}
      {open && (
        <div
          className="fixed inset-0 z-[64] bg-slate-950/40 backdrop-blur-[1px]"
          onClick={closePanel}
        />
      )}

      {/* Panel notifikasi */}
      <div
        aria-hidden={!open && pull === 0}
        onTouchStart={open ? onPanelTouchStart : undefined}
        onTouchMove={open ? onPanelTouchMove : undefined}
        onTouchEnd={open ? onPanelTouchEnd : undefined}
        className="fixed inset-x-0 top-0 z-[65] overflow-hidden rounded-b-[2rem] bg-white shadow-2xl shadow-slate-950/20"
        style={{
          height: Math.max(0, pull),
          paddingTop: 'env(safe-area-inset-top)',
          transition: dragging.current || closingBySwipe.current ? 'none' : 'height 220ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div>
              <p className="text-sm font-black text-slate-950">Notifikasi</p>
              <p className="text-[11px] text-slate-400">Tarik ke atas buat nutup</p>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Tutup"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat notifikasi...
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center text-xs font-bold text-slate-400">
                Belum ada notifikasi. Tenang aja dulu.
              </div>
            ) : (
              items.slice(0, 8).map((item) => {
                const meta = getNotificationMeta(item.type)
                const Icon = meta.icon
                return (
                  <div key={item.id} className={`flex items-start gap-3 border-b border-slate-50 px-5 py-3 ${!item.is_read ? 'bg-blue-50/40' : ''}`}>
                    <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl ${meta.iconBg} ${meta.iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <Link href={item.link ?? '/dashboard/notifications'} onClick={closePanel} className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-slate-950">{item.title}</p>
                      {item.message && <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{item.message}</p>}
                      <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(item.created_at)}</p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => void deleteOne(item.id)}
                      aria-label="Hapus"
                      className="flex-none rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={closePanel}
            className="border-t border-slate-100 px-5 py-3 text-center text-xs font-black text-blue-600 hover:bg-blue-50"
          >
            Lihat semua notifikasi
          </Link>
        </div>
      </div>
    </>
  )
}
