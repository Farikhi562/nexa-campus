import type { Metadata } from 'next'
import NexaChatbot from '@/components/NexaChatbot'
import './globals.css'

export const metadata: Metadata = {
  title: 'NEXA Campus Ecosystem - Platform Mahasiswa Terpadu',
  description:
    'Ekosistem mahasiswa untuk mock exam AI, study room, jadwal ujian, reminder akademik, dan marketplace barang serta jasa kampus.',
  keywords: ['mock exam', 'CBT', 'mahasiswa', 'marketplace kampus', 'ujian', 'AI', 'belajar'],
  openGraph: {
    title: 'NEXA Campus Ecosystem',
    description: 'Platform belajar, komunitas, dan marketplace untuk mahasiswa Indonesia',
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
