import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  Layers3,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from 'lucide-react'
import AuthStatusActions from '@/components/AuthStatusActions'
import NexaCampusLogo from '@/components/brand/NexaCampusLogo'
import ProductPreviewCard from '@/components/marketing/ProductPreviewCard'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { BRAND } from '@/lib/brand'

const sampleDeadlines = [
  {
    title: 'Praktikum AOA',
    source: 'iLab',
    priority: 'urgent',
    urgency: 'Hari ini',
    tone: 'danger' as const,
  },
  {
    title: 'Tugas Algoritma',
    source: 'VClass',
    priority: 'high',
    urgency: 'H-1',
    tone: 'warning' as const,
  },
  {
    title: 'Kuis Matematika',
    source: 'Grup WA',
    priority: 'normal',
    urgency: 'H-3',
    tone: 'info' as const,
  },
]

const steps = [
  'Catat deadline dari VClass, iLab, dosen, grup WA, atau sumber kampus lain.',
  'Lihat prioritas di dashboard.',
  'Aktifkan reminder agar tidak melewatkan deadline.',
]

const features = [
  [
    'Deadline Dashboard',
    'Hari ini, minggu ini, terlambat, dan deadline tanpa reminder langsung kebaca.',
  ],
  [
    'Quick Add Deadline',
    'Input manual cepat untuk tugas, praktikum, kuis, ujian, pembayaran, dan lainnya.',
  ],
  ['Reminder Settings', 'Siap untuk Telegram di MVP testing, WhatsApp tetap roadmap produksi.'],
  [
    'Priority & Category',
    'Beri label urgent, high, normal, atau low biar urutan kerja lebih jelas.',
  ],
  ['Weekly Summary', 'Preview ringkasan mingguan untuk paket berbayar beta.'],
  [
    'Privacy-first manual input',
    'Tidak minta password kampus dan tidak scraping sistem kampus tanpa izin.',
  ],
]

const previewCards = [
  {
    title: 'Dashboard Preview',
    description:
      'Tampilan ringkas untuk melihat deadline hari ini, minggu ini, overdue, dan prioritas tugas.',
    imageSrc: '/screenshots/nexa-campus-dashboard.png',
    placeholderLabel: 'Dashboard Screenshot Placeholder',
    alt: 'Preview dashboard NEXA Campus',
  },
  {
    title: 'Add Deadline Preview',
    description:
      'Flow input manual untuk mencatat tugas, praktikum, ujian, pembayaran UKT, dan deadline akademik lainnya.',
    imageSrc: '/screenshots/nexa-campus-add-deadline.png',
    placeholderLabel: 'Add Deadline Screenshot Placeholder',
    alt: 'Preview tambah deadline NEXA Campus',
  },
  {
    title: 'Reminder Preview',
    description: 'Konsep reminder akademik untuk membantu mahasiswa mengingat deadline penting.',
    imageSrc: '/screenshots/nexa-campus-reminder.png',
    placeholderLabel: 'Reminder Screenshot Placeholder',
    alt: 'Preview reminder NEXA Campus',
  },
]

const faqs = [
  [
    'Apakah NEXA Campus sistem resmi kampus?',
    'Bukan. NEXA Campus adalah produk independen dari NEXA Tech Labs. Info final tetap wajib dicek di kanal resmi kampus.',
  ],
  [
    'Apakah NEXA meminta password kampus?',
    'Tidak. NEXA tidak meminta password VClass, iLab, Studentsite, NPM, atau platform kampus mana pun.',
  ],
  [
    'Apakah deadline otomatis masuk dari VClass/iLab?',
    'Belum. MVP beta fokus ke input manual yang aman dan jelas. Integrasi resmi hanya akan dibuat kalau ada izin yang valid.',
  ],
  [
    'Apakah reminder WhatsApp sudah aktif?',
    'Belum live. WhatsApp via Wablas adalah roadmap produksi. MVP testing disiapkan dengan struktur Telegram.',
  ],
  [
    'Apa beda Radar, Pulse, dan Command?',
    'Radar gratis untuk mulai rapi, Pulse untuk reminder dasar, Command untuk kontrol reminder lebih lengkap dan locked preview fitur beta.',
  ],
  [
    'Bagaimana cara hapus data?',
    'User bisa menghubungi support NEXA untuk request penghapusan data. Detailnya ada di halaman Privacy dan Support.',
  ],
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <NexaCampusLogo tone="dark" imageClassName="h-10 w-10" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-300 md:flex">
            <a href="#cara-kerja" className="hover:text-teal-200">
              Cara Kerja
            </a>
            <a href="#fitur" className="hover:text-teal-200">
              Fitur
            </a>
            <Link href="/pricing" className="hover:text-teal-200">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-teal-200">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-teal-200">
              Support
            </Link>
          </nav>
          <AuthStatusActions variant="dark" />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(45,212,191,0.24),transparent_28rem),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.14),transparent_22rem)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
            <div className="flex flex-col justify-center">
              <Badge
                tone="brand"
                className="mb-5 w-fit border-teal-300/20 bg-teal-300/10 text-teal-100"
              >
                MVP Beta · NEXA Tech Labs
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Platform anti-lupa deadline untuk mahasiswa.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Catat tugas, praktikum, ujian, pembayaran, dan pengingat akademik dalam satu
                dashboard yang cepat dibaca.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300"
                >
                  Join Early Access
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Lihat Pricing
                </Link>
              </div>
              <div className="mt-6 flex max-w-xl gap-3 rounded-2xl border border-teal-200/15 bg-teal-200/[0.06] p-4 text-sm leading-6 text-teal-50">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-200" />
                <p>Tidak meminta password kampus. Deadline dicatat manual oleh user.</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black">Deadline Radar</p>
                    <p className="text-xs text-slate-400">Contoh preview dashboard</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
                    <Radar className="h-5 w-5" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['Hari ini', 'Minggu ini', 'Tanpa reminder'].map((label, index) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"
                    >
                      <p className="text-2xl font-black">{index === 0 ? 1 : index === 1 ? 3 : 2}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {sampleDeadlines.map((deadline) => (
                    <div
                      key={deadline.title}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
                        <TimerReset className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{deadline.title}</p>
                        <p className="text-xs text-slate-400">
                          {deadline.source} · {deadline.priority}
                        </p>
                      </div>
                      <Badge tone={deadline.tone}>{deadline.urgency}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="success">Telegram Ready</Badge>
                  <Badge tone="warning">WhatsApp Roadmap</Badge>
                  <Badge tone="info">AI Locked Preview</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">
                Preview NEXA Campus
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Beberapa tampilan produk sedang disiapkan.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Screenshot final akan ditambahkan setelah UI beta selesai.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {previewCards.map((card) => (
                <ProductPreviewCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="border-b border-white/10 bg-white text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Cara Kerja</p>
              <h2 className="mt-2 text-3xl font-black">Dari info nyebar jadi dashboard jelas.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step}>
                  <CardContent>
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-lg font-black text-brand-700">
                      {index + 1}
                    </div>
                    <p className="text-sm font-bold leading-6 text-slate-700">{step}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="fitur" className="bg-slate-50 text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Fitur MVP</p>
              <h2 className="mt-2 text-3xl font-black">Fokus ke yang bikin deadline kelihatan.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([title, desc]) => (
                <Card key={title}>
                  <CardContent>
                    <CheckCircle2 className="mb-4 h-5 w-5 text-brand-700" />
                    <h3 className="font-black text-slate-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Badge
                tone="brand"
                className="mb-4 w-fit border-teal-300/20 bg-teal-300/10 text-teal-100"
              >
                Trust & Privacy
              </Badge>
              <h2 className="text-3xl font-black">
                NEXA bantu ngingetin, bukan ngintip akun kampus.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">{BRAND.disclaimer}</p>
            </div>
            <div className="grid gap-3">
              {[
                'NEXA tidak meminta password VClass, iLab, Studentsite, atau platform kampus lain.',
                'NEXA tidak scraping sistem kampus tanpa izin.',
                'Data yang disimpan hanya profil, deadline yang user input sendiri, kontak reminder opsional, dan status paket/subscription.',
              ].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-slate-300"
                >
                  <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-200" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">FAQ</p>
              <h2 className="mt-2 text-3xl font-black">
                Jawaban singkat, biar nggak tebak-tebakan.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map(([question, answer]) => (
                <Card key={question}>
                  <CardContent>
                    <HelpCircle className="mb-4 h-5 w-5 text-brand-700" />
                    <h3 className="font-black text-slate-950">{question}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 text-center backdrop-blur sm:p-10">
              <Layers3 className="mx-auto mb-4 h-7 w-7 text-teal-200" />
              <h2 className="text-3xl font-black">Mulai dari NEXA Radar gratis.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Catat deadline pertama, lihat yang paling dekat, dan biarkan dashboard bantu kamu
                berhenti pura-pura ingat semuanya.
              </p>
              <Link
                href="/login?mode=signup"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
              >
                Join Early Access
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
