import type { Metadata } from 'next'
import NexaChatbot from '@/components/NexaChatbot'
import { BRAND } from '@/lib/brand'
import './globals.css'

export const metadata: Metadata = {
  title: `${BRAND.productName} - Platform Mahasiswa Terpadu`,
  description:
    `${BRAND.productName} by ${BRAND.companyName}: ekosistem mahasiswa dengan mock exam AI ${BRAND.aiProvider}, study room, jadwal ujian, reminder akademik, marketplace kampus, dan pembayaran ${BRAND.paymentProvider}.`,
  keywords: ['mock exam', 'CBT', 'mahasiswa', 'marketplace kampus', 'ujian', 'AI', 'belajar'],
  metadataBase: new URL(BRAND.siteUrl),
  openGraph: {
    title: BRAND.productName,
    description: `Produk resmi ${BRAND.companyName} untuk belajar, komunitas, dan marketplace mahasiswa Indonesia.`,
    url: BRAND.siteUrl,
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-body bg-slate-50 text-slate-900 antialiased">
        {children}
        <NexaChatbot />
      </body>
    </html>
  )
}
