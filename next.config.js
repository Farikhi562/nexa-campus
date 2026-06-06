let withPWA = (config) => config

try {
  withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
    fallbacks: {
      document: '/offline.html',
    },
    runtimeCaching: [
      {
        urlPattern: /^https?.*\/api\/(schedules|exam-schedules).*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'nexa-deadlines',
          expiration: {
            maxEntries: 24,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          networkTimeoutSeconds: 5,
        },
      },
      {
        urlPattern: /^https?.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'nexa-images',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60,
          },
        },
      },
      {
        urlPattern: /^https?.*$/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'nexa-pages',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  })
} catch (error) {
  console.warn('[next.config] next-pwa disabled:', error.message)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
}

module.exports = withPWA(nextConfig)
