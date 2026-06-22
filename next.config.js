/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Izinkan semua subdomain Supabase (storage avatar, attachment file).
    // Kalau project kamu pakai custom domain, tambahkan di sini juga.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Percepat DNS prefetch untuk sub-resource
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Cegah situs ini di-embed di iframe orang lain (clickjacking)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Cegah browser menebak MIME type (MIME sniffing attacks)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Kirim referrer hanya untuk same-origin atau ke HTTPS — jangan
          // bocorkan URL penuh ke pihak ketiga lewat HTTP
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Batasi akses ke sensor perangkat yang tidak dipakai app
          // (camera/mic/geolocation butuh izin user terpisah, bukan header ini)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
