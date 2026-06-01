import Link from 'next/link'
import NexaLogo from '@/components/NexaLogo'

const TERMS = [
  'NEXA Campus bukan platform resmi universitas atau kampus mana pun.',
  'User wajib memverifikasi informasi akademik final melalui kanal resmi kampus.',
  'Reminder dapat gagal karena provider, jaringan, konfigurasi bot, atau gangguan sistem.',
  'User bertanggung jawab atas akurasi data deadline yang dimasukkan.',
  'NEXA menghormati aturan kampus dan hukum yang berlaku di Indonesia.',
  'Fitur roadmap seperti WhatsApp Wablas, AI Quick Add, dan Ask NEXA belum dianggap fitur produksi sampai diumumkan resmi.',
]

export default function TermsPage() {
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
        <h1 className="text-3xl font-black text-slate-950">Terms of Service</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Dengan menggunakan NEXA Campus, user memahami bahwa produk ini adalah alat bantu pribadi untuk mencatat dan mengingat deadline.
        </p>
        <ul className="mt-6 space-y-3">
          {TERMS.map((item) => (
            <li key={item} className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </article>
    </main>
  )
}
