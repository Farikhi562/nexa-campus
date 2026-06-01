import type { Metadata } from 'next'
import { BRAND } from '@/lib/brand'
import './globals.css'

export const metadata: Metadata = {
  title: `${BRAND.productName} - Anti Lupa Deadline Kampus`,
  description:
    `${BRAND.productName} by ${BRAND.companyName}: dashboard deadline tugas dan praktikum untuk mahasiswa, dengan reminder privacy-first.`,
  keywords: ['deadline mahasiswa', 'reminder tugas', 'praktikum', 'kampus', 'NEXA Campus'],
  metadataBase: new URL(BRAND.siteUrl),
  openGraph: {
    title: BRAND.productName,
    description: 'Platform anti-lupa deadline untuk mahasiswa.',
    url: BRAND.siteUrl,
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-body bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
