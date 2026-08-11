// NEXA Campus — Push Service Worker
// Didaftarkan terpisah dari service worker PWA (next-pwa) di /sw.js,
// supaya tidak perlu mengubah konfigurasi next-pwa.
// File ini HANYA menangani push notification & klik notifikasi.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'NEXA Campus', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'NEXA Campus'
  const targetUrl = data.url || '/dashboard'
  // Notifikasi "urgent" (deadline hari-H) bergetar lebih tegas & tetap
  // nempel di layar (requireInteraction) sampai user sentuh, mirip gaya
  // notifikasi chat/WA di panel notifikasi Android.
  const urgent = data.tag === 'deadline-day' || data.urgent === true

  const options = {
    body: data.body || '',
    // icon = ikon besar di kiri notifikasi, badge = ikon monokrom kecil
    // di status bar (Android). Keduanya pakai logo NEXA supaya langsung
    // kebaca app-nya walau notifikasi tersembunyi/grouped.
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image || undefined,
    tag: data.tag || 'nexa-campus',
    renotify: true,
    requireInteraction: urgent,
    silent: false,
    vibrate: urgent ? [200, 100, 200, 100, 200] : [150, 80, 150],
    timestamp: data.timestamp || Date.now(),
    data: { url: targetUrl },
    actions: [
      { action: 'open', title: 'Buka' },
      { action: 'dismiss', title: 'Tutup' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
