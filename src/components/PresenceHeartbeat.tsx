'use client'

import { useCallback, useEffect } from 'react'

export default function PresenceHeartbeat() {
  const beat = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    try {
      await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_path: window.location.pathname }),
        keepalive: true,
      })
    } catch {
      // Presence adalah fitur pendukung. Jika gagal, alur utama pengguna tetap berjalan.
    }
  }, [])

  useEffect(() => {
    void beat()
    const interval = window.setInterval(() => void beat(), 45_000)
    const onFocus = () => void beat()
    const onVisibility = () => { if (document.visibilityState === 'visible') void beat() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [beat])

  return null
}
