import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowLeft,
  BellRing,
  BookOpenCheck,
  CreditCard,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ NEXA Campus v1.0 - NEXA Campus Ecosystem',
  description:
    'Pertanyaan umum resmi NEXA Campus Ecosystem v1.0 tentang akun, fitur belajar, marketplace, paket, Midtrans, dan support.',
}

const FAQ_GROUPS = [
  {
    title: 'Akun dan akses',
    icon: ShieldCheck,
    items: [
      ['NEXA Campus v1.0 itu apa?', 'NEXA Campus Ecosystem v1.0 adalah platform mahasiswa untuk belajar dari dokumen, latihan mock exam, mengatur reminder, membuka marketplace kampus, dan memakai AI Campus Tools.'],
      ['Apakah harus login?', 'Ya. Login diperlukan untuk menyimpan profil, dokumen, reminder, marketplace, dan hasil belajar.'],
      ['Kenapa harus lengkapi profil?', 'Profil membantu NEXA menyesuaikan pengalaman kampus, jurusan, marketplace, dan rekomendasi fitur.'],
    ],
  },
  {
    title: 'Belajar dan AI',
    icon: BookOpenCheck,
    items: [
      ['Bagaimana mock exam AI bekerja?', 'User upload dokumen belajar, sistem mengekstrak materi, lalu AI membantu membuat soal latihan dengan pilihan jawaban dan pembahasan.'],
      ['Apakah jawaban AI selalu benar?', 'Tidak selalu. AI membantu mempercepat belajar, tetapi user tetap perlu mengecek ulang materi penting.'],
      ['Campus Tools bisa dipakai untuk apa?', 'Tools bisa membantu IPK, sitasi, ringkasan, soal latihan, career plan, beasiswa, research helper, marketplace copy, dan planner tugas.'],
    ],
  },
  {
    title: 'Reminder dan Study Room',
    icon: BellRing,
    items: [
      ['Reminder dasar bisa dipakai siapa?', 'Semua user bisa menyimpan agenda tugas, ujian, praktikum, kuis, presentasi, dan organisasi.'],
      ['WhatsApp reminder tersedia di paket apa?', 'WhatsApp reminder otomatis disiapkan untuk paket Pro.'],
      ['Study Room untuk apa?', 'Study Room membantu belajar bareng teman memakai kode room, sesi latihan, dan leaderboard.'],
    ],
  },
  {
    title: 'Marketplace kampus',
    icon: Store,
    items: [
      ['Siapa yang bisa jual barang dan jasa?', 'Akun Basic dan Pro bisa membuat listing. Akun Free bisa melihat marketplace dan menghubungi seller.'],
      ['Apa saja yang boleh dijual?', 'Barang dan jasa yang relevan untuk kebutuhan mahasiswa, seperti buku, alat praktikum, jasa desain, tutoring, catatan, atau kebutuhan kampus lain yang legal.'],
      ['Apakah NEXA menahan dana transaksi marketplace?', 'Di v1.0, marketplace berfungsi sebagai listing dan kontak. Transaksi antar user dilakukan langsung dengan prinsip aman dan jujur.'],
    ],
  },
  {
    title: 'Paket dan pembayaran',
    icon: CreditCard,
    items: [
      ['Apa bedanya Free, Basic, dan Pro?', 'Free untuk coba fitur dasar. Basic membuka seller marketplace dan fitur belajar lebih luas. Pro membuka fitur lengkap seperti unlimited dokumen, WhatsApp reminder, Study Room, dan analytics.'],
      ['Pembayaran pakai apa?', 'NEXA v1.0 diarahkan ke Midtrans checkout atau admin untuk aktivasi awal.'],
      ['Setelah bayar, paket aktif kapan?', 'Paket diaktifkan setelah pembayaran Midtrans atau konfirmasi admin selesai. Pastikan email akun NEXA sama dengan data checkout.'],
    ],
  },
  {
    title: 'Support dan keamanan',
    icon: HelpCircle,
    items: [
      ['Kalau profil gagal disimpan bagaimana?', 'Coba refresh dan login ulang. Jika masih gagal, hubungi admin dengan email akun, nama, dan screenshot error.'],
      ['Apakah dokumen saya aman?', 'Dokumen dipakai untuk fitur belajar akun kamu. Jangan upload dokumen yang melanggar hak cipta atau berisi data sensitif orang lain.'],
      ['Bagaimana cara hubungi admin?', 'Buka halaman Contact atau gunakan chatbot untuk diarahkan ke halaman yang tepat.'],
    ],
  },
]

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-700 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
            <MessageCircle className="h-4 w-4" />
            Kontak
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              NEXA Campus v1.0
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              FAQ resmi untuk user NEXA.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              Halaman ini menjawab pertanyaan umum tentang akun, fitur belajar, marketplace, paket, Midtrans, dan support NEXA Campus Ecosystem v1.0.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                ['Versi', 'v1.0'],
                ['Payment', 'Midtrans ready'],
                ['Support', 'Chatbot + Contact'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-xl font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {FAQ_GROUPS.map(({ title, icon: Icon }) => (
                <a key={title} href={`#${title.toLowerCase().replaceAll(' ', '-')}`} className="rounded-lg border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-600" />
                  <p className="mt-3 text-sm font-black">{title}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="space-y-6">
          {FAQ_GROUPS.map(({ title, icon: Icon, items }) => (
            <section key={title} id={title.toLowerCase().replaceAll(' ', '-')} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black">{title}</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {items.map(([question, answer]) => (
                  <div key={question} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="font-black text-slate-950">{question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Zap className="mt-1 h-6 w-6 flex-shrink-0 text-brand-700" />
              <div>
                <h2 className="text-lg font-black">Masih bingung?</h2>
                <p className="mt-1 text-sm leading-6 text-brand-900">
                  Gunakan chatbot di pojok kanan bawah atau hubungi admin untuk aktivasi paket, Midtrans, dan support akun.
                </p>
              </div>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700">
              <Users className="h-4 w-4" />
              Hubungi Admin
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
