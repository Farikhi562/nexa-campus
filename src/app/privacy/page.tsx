import Link from 'next/link'
import NexaLogo from '@/components/NexaLogo'

const ITEMS = [
  'NEXA tidak meminta atau menyimpan password VClass, iLab, Studentsite, NPM, atau platform kampus lain.',
  'NEXA menyimpan data profil, deadline yang user input sendiri, kontak opsional untuk reminder, dan status paket/subscription intent.',
  'Telegram atau WhatsApp hanya disimpan jika user memilih memakai reminder.',
  'User dapat meminta penghapusan data dengan menghubungi support NEXA Tech Labs.',
  'Database dirancang dengan Supabase Row Level Security agar user hanya mengakses data miliknya sendiri.',
  'NEXA tidak melakukan scraping sistem kampus tanpa izin.',
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <NexaLogo className="h-9 w-9" />
            <span className="font-black">NEXA Campus</span>
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black text-slate-950">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          NEXA Campus dibangun dengan prinsip data minimum. Kami hanya menyimpan data yang dibutuhkan agar dashboard deadline dan reminder bisa bekerja.
        </p>
        <ul className="mt-6 space-y-3">
          {ITEMS.map((item) => (
            <li key={item} className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </article>
    </main>
  )
}
