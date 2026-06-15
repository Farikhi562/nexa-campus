'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

/**
 * Tombol "Aktifkan Notifikasi HP" — Web Push.
 * Pasang di halaman /dashboard/settings/reminders.
 *
 * Catatan iOS: Web Push di iOS Safari hanya jalan setelah app di-"Add to Home Screen"
 * (mode standalone), iOS 16.4+. Di Android & desktop langsung berfungsi.
 */

const PUSH_SW_URL = '/push-sw.js'
const PUSH_SW_SCOPE = '/push-notify/'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

type Status = 'checking' | 'unsupported' | 'subscribed' | 'unsubscribed' | 'denied'

export default function PushNotificationSettings() {
  const [status, setStatus] = useState<Status>('checking')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    void check()
  }, [])

  async function check() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE)
      const sub = await reg?.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    } catch {
      setStatus('unsubscribed')
    }
  }

  async function enable() {
    setLoading(true)
    setMessage(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'unsubscribed')
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setMessage({ type: 'err', text: 'Server belum mengaktifkan Web Push (VAPID key kosong).' })
        return
      }

      const reg = await navigator.serviceWorker.register(PUSH_SW_URL, { scope: PUSH_SW_SCOPE })
      await navigator.serviceWorker.ready

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setMessage({ type: 'err', text: data?.error || 'Gagal mendaftarkan notifikasi.' })
        return
      }

      setStatus('subscribed')
      setMessage({ type: 'ok', text: 'Notifikasi HP aktif! Reminder deadline akan muncul di perangkat ini.' })
    } catch {
      setMessage({ type: 'err', text: 'Gagal mengaktifkan notifikasi. Coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  async function disable() {
    setLoading(true)
    setMessage(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE)
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
      setMessage({ type: 'ok', text: 'Notifikasi HP dimatikan untuk perangkat ini.' })
    } catch {
      setMessage({ type: 'err', text: 'Gagal menonaktifkan notifikasi.' })
    } finally {
      setLoading(false)
    }
  }

  async function sendTest() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error || 'Gagal mengirim notifikasi tes.' })
        return
      }
      setMessage({ type: 'ok', text: `Notifikasi tes dikirim ke ${data.sent}/${data.total} perangkat.` })
    } catch {
      setMessage({ type: 'err', text: 'Gagal mengirim notifikasi tes.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-teal-600 text-white">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-slate-950">Notifikasi HP (Web Push)</h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Dapatkan reminder deadline langsung sebagai notifikasi di HP/laptop, walau tab NEXA Campus tertutup.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {status === 'checking' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memeriksa status...
              </span>
            )}

            {status === 'unsupported' && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
                <BellOff className="h-3.5 w-3.5" />
                Browser ini belum mendukung notifikasi push.
              </span>
            )}

            {status === 'denied' && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Izin notifikasi diblokir. Aktifkan dari setelan browser/HP, lalu muat ulang halaman.
              </span>
            )}

            {status === 'unsubscribed' && (
              <button
                type="button"
                onClick={enable}
                disabled={loading}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                Aktifkan Notifikasi HP
              </button>
            )}

            {status === 'subscribed' && (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Aktif di perangkat ini
                </span>
                <button
                  type="button"
                  onClick={sendTest}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Kirim tes
                </button>
                <button
                  type="button"
                  onClick={disable}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Matikan
                </button>
              </>
            )}
          </div>

          {message && (
            <p className={`mt-2 rounded-xl px-3 py-2 text-xs leading-5 ${
              message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </p>
          )}

          <p className="mt-2 text-[11px] leading-4 text-slate-400">
            Default: notifikasi dikirim H-1 dan hari-H deadline. Di iPhone, tambahkan NEXA Campus ke
            Home Screen dulu ("Add to Home Screen") agar notifikasi bisa muncul.
          </p>
        </div>
      </div>
    </div>
  )
}
