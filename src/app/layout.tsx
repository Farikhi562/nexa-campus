import type { Metadata } from 'next'
import InstallAppPrompt from '@/components/InstallAppPrompt'
import { BRAND } from '@/lib/brand'
import './globals.css'

export const metadata: Metadata = {
  applicationName: 'NEXA Campus',
  category: 'productivity',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    title: 'NEXA Campus',
    statusBarStyle: 'default',
  },
  title: 'NEXA Campus - Platform Anti-Lupa Deadline Kampus',
  description:
    'Dashboard deadline dan reminder akademik untuk mahasiswa. Catat tugas, praktikum, ujian, dan deadline kampus tanpa meminta password kampus.',
  keywords: ['deadline mahasiswa', 'reminder tugas', 'praktikum', 'kampus', 'NEXA Campus'],
  metadataBase: new URL(BRAND.siteUrl),
  openGraph: {
    title: 'NEXA Campus - Platform Anti-Lupa Deadline Kampus',
    description:
      'Dashboard deadline dan reminder akademik untuk mahasiswa. Catat tugas, praktikum, ujian, dan deadline kampus tanpa meminta password kampus.',
    url: BRAND.siteUrl,
    siteName: `${BRAND.productName} by ${BRAND.companyName}`,
    type: 'website',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-body bg-slate-50 text-slate-900 antialiased">
        {children}
        <InstallAppPrompt />
      </body>
    </html>
  )
}
