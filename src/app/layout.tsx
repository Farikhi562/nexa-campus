import type { Metadata, Viewport } from 'next'
import InstallAppPrompt from '@/components/InstallAppPrompt'
import { BRAND } from '@/lib/brand'
import './globals.css'

const TITLE = 'NEXA Campus — Anti-Lupa Deadline Kampus untuk Mahasiswa'
const DESCRIPTION =
  'Dashboard deadline & reminder akademik untuk mahasiswa Indonesia. Catat tugas, praktikum, kuis, dan ujian, dapat reminder Telegram, dan saingi teman di leaderboard — tanpa meminta password kampus.'

export const metadata: Metadata = {
  applicationName: 'NEXA Campus',
  category: 'productivity',
  manifest: '/manifest.webmanifest',
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: TITLE,
    template: '%s · NEXA Campus',
  },
  description: DESCRIPTION,
  keywords: [
    'deadline mahasiswa',
    'reminder tugas kuliah',
    'aplikasi deadline kampus',
    'pengingat ujian',
    'praktikum',
    'manajemen tugas mahasiswa',
    'NEXA Campus',
  ],
  authors: [{ name: BRAND.companyName }],
  creator: BRAND.companyName,
  publisher: BRAND.companyName,
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    title: 'NEXA Campus',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: BRAND.siteUrl,
    siteName: `${BRAND.productName} by ${BRAND.companyName}`,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f766e' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NEXA Campus',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web, Android, iOS',
  description: DESCRIPTION,
  url: BRAND.siteUrl,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
  },
  publisher: {
    '@type': 'Organization',
    name: BRAND.companyName,
    url: BRAND.siteUrl,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-body bg-slate-50 text-slate-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <InstallAppPrompt />
      </body>
    </html>
  )
}
