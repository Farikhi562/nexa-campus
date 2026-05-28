import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  CheckCircle2,
  CreditCard,
  LineChart,
  MessageCircle,
  Rocket,
  Store,
  Users,
} from 'lucide-react'
import NexaLogo from '@/components/NexaLogo'
import PoweredByFooter from '@/components/PoweredByFooter'

const FEATURES = [
  {
    icon: BookOpenCheck,
    title: 'Mock Exam AI',
    desc: 'Materi kuliah jadi latihan CBT dengan skor, pembahasan, dan progress belajar.',
  },
  {
    icon: BellRing,
    title: 'Smart Reminder',
    desc: 'Deadline tugas, praktikum, kuis, presentasi, ujian, dan organisasi masuk satu timeline.',
  },
  {
    icon: Store,
    title: 'Campus Marketplace',
    desc: 'Mahasiswa bisa cari kebutuhan kampus. Akun berbayar bisa jual barang dan jasa.',
  },
  {
    icon: Users,
    title: 'Study Room',
    desc: 'Ruang belajar, kode undangan, leaderboard, dan kompetisi sehat antar teman.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Automation',
    desc: 'Reminder otomatis untuk agenda penting agar deadline tidak lewat.',
  },
  {
    icon: LineChart,
    title: 'Campus Tools',
    desc: '15 tools untuk planner, IPK, sitasi, karier, beasiswa, event, dan habit tracker.',
  },
]

const PLANS = [
  {
    name: 'Gratis',
    price: 'Rp0',
    desc: 'Coba core learning',
    features: ['1 materi belajar', '1 mock exam', 'Lihat marketplace', 'Preview Campus Tools'],
    cta: 'Mulai Gratis',
    href: '/auth/login',
  },
  {
    name: 'Basic',
    price: 'Rp15.000',
    desc: 'Paling pas untuk mayoritas mahasiswa',
    features: ['5 materi belajar', 'Mock exam tak terbatas', 'Ekspor PDF', 'Buka lapak barang/jasa'],
    cta: 'Ambil Basic',
    href: '/auth/login',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'Rp25.000',
    desc: 'Untuk semester padat dan organisasi',
    features: ['Materi tak terbatas', 'Study Room', 'Smart Reminder otomatis', 'WhatsApp reminder kampus'],
    cta: 'Ambil Pro',
    href: '/auth/login',
  },
]

const ROADMAP = [
  ['Hari 1', 'Upload materi, buat akun, lengkapi profil'],
  ['Minggu 1', 'Pakai mock exam dan smart reminder untuk UTS/tugas'],
  ['Minggu 2', 'Buka lapak jasa/barang kalau sudah upgrade Basic/Pro'],
  ['Semester', 'Pantau IPK, beasiswa, event, project kelompok, dan karier'],
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <NexaLogo className="h-10 w-10 rounded-xl bg-white ring-1 ring-slate-200" />
            <div>
              <p className="text-lg font-black leading-5 tracking-tight text-slate-950">NEXA</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Campus Ecosystem</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#fitur" className="hover:text-brand-700">Fitur</a>
            <a href="#harga" className="hover:text-brand-700">Harga</a>
            <Link href="/faq" className="hover:text-brand-700">FAQ</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-brand-700">
              Masuk
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              Mulai
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                <Rocket className="h-3.5 w-3.5" />
                Siap dijual untuk mahasiswa Indonesia
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                Sistem operasi kuliah untuk belajar, deadline, komunitas, dan income kampus.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                NEXA Campus Ecosystem menyatukan mock exam AI, smart reminder, marketplace mahasiswa, study room, dan 15 Campus Tools dalam satu produk yang gampang dijual: murah, relevan, dan langsung terasa manfaatnya.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700"
                >
                  Coba Gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#harga"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Lihat Paket
                </a>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ['Rp15rb', 'mulai berbayar'],
                  ['15+', 'campus tools'],
                  ['<2 menit', 'materi jadi latihan'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xl font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="rounded-lg bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">Semester Command Center</p>
                    <p className="text-xs text-slate-500">Modul aktif NEXA</p>
                  </div>
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="space-y-3">
                  {[
                    ['AI Exam', 'Upload PDF jadi soal latihan', 'Siap dipakai'],
                    ['Reminder', 'Agenda dan deadline user', 'WhatsApp Pro'],
                    ['Marketplace', 'Listing asli dari user', 'Basic seller'],
                    ['Campus Tools', 'IPK, sitasi, beasiswa, career assistant', '15 tools'],
                  ].map(([type, title, status]) => (
                    <div key={title} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <BellRing className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{type}</p>
                        <p className="truncate text-sm font-black text-slate-950">{title}</p>
                      </div>
                      <p className="text-right text-xs font-semibold text-slate-500">{status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-brand-950 p-5 text-white">
                  <Store className="mb-4 h-5 w-5 text-cyan-200" />
                  <p className="text-2xl font-black">Buyer + seller</p>
                  <p className="mt-1 text-xs text-brand-200">Free bisa browse, Basic/Pro bisa jual</p>
                </div>
                <div className="rounded-lg bg-white p-5 shadow-sm">
                  <CreditCard className="mb-4 h-5 w-5 text-brand-600" />
                  <p className="text-2xl font-black text-slate-950">BEP friendly</p>
                  <p className="mt-1 text-xs text-slate-500">Harga ramah mahasiswa</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Produk utama</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Fitur yang bisa dijual karena sakitnya nyata.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              NEXA bukan cuma latihan soal. Ia menyentuh masalah harian mahasiswa: telat deadline, bingung belajar, butuh uang tambahan, dan butuh alat akademik cepat.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Kenapa siap dijual</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Value proposition jelas untuk mahasiswa dan kampus.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Produk ini punya freemium hook, alasan upgrade, dan use case berulang setiap minggu selama semester.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Pain harian', 'deadline, tugas kelompok, ujian, dan administrasi akademik'],
                ['Monetisasi natural', 'seller marketplace, export PDF, reminder otomatis, study room'],
                ['Retensi tinggi', 'dipakai berulang selama semester, bukan sekali buka'],
                ['Distribusi mudah', 'bisa dijual lewat kelas, organisasi, komunitas, dan affiliate kampus'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <CheckCircle2 className="mb-4 h-5 w-5 text-emerald-600" />
                  <h3 className="font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="harga" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <div className="mb-10 text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Harga</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Murah buat mahasiswa, cukup kuat buat bisnis.</h2>
              <p className="mt-3 text-sm text-slate-600">Basic setara satu makan hemat. Pro setara dua kopi, tapi bantu satu semester.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border bg-white p-6 shadow-sm ${plan.highlighted ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200'}`}
                >
                  {plan.highlighted && (
                    <span className="mb-4 inline-flex rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                      Rekomendasi jualan awal
                    </span>
                  )}
                  <h3 className="text-lg font-black text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.desc}</p>
                  <div className="mt-5">
                    <span className="text-3xl font-black text-slate-950">{plan.price}</span>
                    <span className="text-sm text-slate-500">/bulan</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${
                      plan.highlighted ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Go-to-market</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Alur jualan yang bisa langsung dijalankan.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {ROADMAP.map(([step, desc]) => (
                <div key={step} className="rounded-lg border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-700">{step}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-16">
            <div className="mb-10 text-center">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">FAQ</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Jawaban untuk calon pembeli.</h2>
            </div>
            <div className="space-y-4">
              {[
                ['Apakah gratis bisa dipakai?', 'Bisa. Free dipakai untuk mencoba core learning dan melihat marketplace.'],
                ['Kenapa harus upgrade Basic?', 'Basic membuka mock exam tak terbatas, export PDF, dan hak jual barang/jasa.'],
                ['Kenapa Pro?', 'Pro cocok untuk mahasiswa dengan banyak agenda karena membuka reminder otomatis, Study Room, dan unlimited materi.'],
                ['Apakah marketplace bebas?', 'Tidak. Hanya Basic dan Pro yang bisa membuat listing supaya kualitas seller lebih terjaga.'],
              ].map(([q, a]) => (
                <div key={q} className="rounded-lg border border-slate-200 p-5">
                  <h3 className="font-black text-slate-950">{q}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PoweredByFooter />
    </div>
  )
}
