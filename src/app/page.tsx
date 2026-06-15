export const dynamic = 'force-dynamic'

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
  { title: 'Praktikum AOA', source: 'iLab', priority: 'urgent', urgency: 'Hari ini', tone: 'danger' as const },
  { title: 'Tugas Algoritma', source: 'VClass', priority: 'high', urgency: 'H-1', tone: 'warning' as const },
  { title: 'Kuis Matematika', source: 'Grup WA', priority: 'normal', urgency: 'H-3', tone: 'info' as const },
]

const steps = [
  'Masukkan tugas dari VClass, iLab, dosen, grup WA, atau catatan kampus lain',
  'Lihat mana yang paling dekat dan paling penting',
  'Nyalakan reminder supaya tidak baru ingat pas udah mepet',
]

const features = [
  ['Ringkasan Deadline', 'Tugas hari ini, minggu ini, yang terlambat, dan yang belum punya reminder tampil dalam satu tempat'],
  ['Tambah Cepat', 'Catat tugas, praktikum, kuis, ujian, pembayaran, atau agenda kampus lain tanpa banyak langkah'],
  ['Pengingat Fleksibel', 'Mulai dari reminder Telegram, lalu bisa diperluas ke channel lain setelah sistem utama stabil'],
  ['Prioritas & Kategori', 'Tandai mana yang urgent, high, normal, atau low supaya urutan kerja lebih enak dibaca'],
  ['Ringkasan Mingguan', 'Lihat gambaran tugas yang perlu dibereskan dalam beberapa hari ke depan'],
  ['Input Aman', 'NEXA tidak meminta password kampus dan tidak mengambil data dari sistem kampus tanpa izin'],
]

const previewCards = [
  {
    title: 'Tampilan Dashboard',
    description: 'Ringkasan tugas yang perlu dikerjakan hari ini, minggu ini, dan yang sudah terlambat',
    imageSrc: '/screenshots/nexa-campus-dashboard.png',
    placeholderLabel: 'Contoh tampilan dashboard',
    alt: 'Tampilan dashboard NEXA Campus',
  },
  {
    title: 'Tambah Deadline',
    description: 'Form sederhana untuk mencatat tugas, praktikum, ujian, pembayaran UKT, dan agenda akademik lain',
    imageSrc: '/screenshots/nexa-campus-add-deadline.png',
    placeholderLabel: 'Contoh form tambah deadline',
    alt: 'Tampilan tambah deadline NEXA Campus',
  },
  {
    title: 'Pengingat Deadline',
    description: 'Pengingat sederhana supaya deadline penting tidak lewat begitu saja',
    imageSrc: '/screenshots/nexa-campus-reminder.png',
    placeholderLabel: 'Contoh tampilan reminder',
    alt: 'Tampilan reminder NEXA Campus',
  },
]

const faqs = [
  ['Apakah NEXA Campus aplikasi resmi kampus?', 'Bukan, NEXA Campus adalah produk independen dari NEXA Tech Labs. Informasi final tetap harus dicek lewat kanal resmi kampus'],
  ['Apakah NEXA meminta password kampus?', 'Tidak, NEXA tidak meminta password VClass, iLab, Studentsite, NPM, atau akun kampus lain'],
  ['Apakah deadline otomatis masuk dari VClass atau iLab?', 'Belum, saat ini NEXA fokus ke input manual yang aman, integrasi hanya akan dibuat jika ada izin yang jelas'],
  ['Apakah reminder WhatsApp sudah aktif?', 'Belum, untuk tahap awal, reminder disiapkan lewat Telegram, WhatsApp akan dipertimbangkan setelah sistem utama stabil'],
  ['Apa beda Radar, Pulse, dan Command?', 'Radar untuk mulai mencatat deadline, Pulse untuk reminder dasar, dan Command untuk pengaturan reminder yang lebih detail'],
  ['Bagaimana cara menghapus data?', 'Kamu bisa menghubungi support NEXA untuk meminta penghapusan data. Detailnya ada di halaman Privacy dan Support'],
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
            <a href="#cara-kerja" className="hover:text-teal-200">Cara Kerja</a>
            <a href="#fitur" className="hover:text-teal-200">Fitur</a>
            <Link href="/pricing" className="hover:text-teal-200">Pricing</Link>
            <Link href="/privacy" className="hover:text-teal-200">Privacy</Link>
            <Link href="/support" className="hover:text-teal-200">Support</Link>
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
              <Badge tone="brand" className="mb-5 w-fit border-teal-300/20 bg-teal-300/10 text-teal-100">
                Siap Dipakai - NEXA Tech Labs
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Tempat rapi untuk mencatat deadline kampus
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Simpan tugas, praktikum, ujian, pembayaran, dan pengingat kuliah dalam satu dashboard yang gampang dicek lagi
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300"
                >
                  Mulai Pakai Gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Lihat Paket
                </Link>
              </div>
              <div className="mt-6 flex max-w-xl gap-3 rounded-2xl border border-teal-200/15 bg-teal-200/[0.06] p-4 text-sm leading-6 text-teal-50">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-200" />
                <p>NEXA tidak meminta password kampus. Semua deadline dicatat sendiri oleh pengguna</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-4">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black">Deadline Radar</p>
                    <p className="text-xs text-slate-400">Contoh tampilan dashboard</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
                    <Radar className="h-5 w-5" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {['Hari ini', 'Minggu ini', 'Tanpa reminder'].map((label, index) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                      <p className="text-2xl font-black">{index === 0 ? 1 : index === 1 ? 3 : 2}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  {sampleDeadlines.map((deadline) => (
                    <div key={deadline.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
                        <TimerReset className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{deadline.title}</p>
                        <p className="text-xs text-slate-400">{deadline.source} · {deadline.priority}</p>
                      </div>
                      <Badge tone={deadline.tone}>{deadline.urgency}</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="success">Telegram siap diuji</Badge>
                  <Badge tone="warning">WhatsApp menyusul</Badge>
                  <Badge tone="info">NEXA Assistant aktif</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 text-slate-950">
          <div className="mx-auto max-w-7xl px-4 py-14">
            <div className="mb-8 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Lihat sekilas</p>
              <h2 className="mt-2 text-3xl font-black">Tampilan inti NEXA Campus.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Alur utama sudah bisa dipakai untuk mencatat, mengingatkan, dan mengatur deadline harian
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
              <h2 className="mt-2 text-3xl font-black">Dari info yang tercecer jadi daftar yang jelas</h2>
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
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Fitur utama</p>
              <h2 className="mt-2 text-3xl font-black">Fokus ke hal yang paling sering bikin mahasiswa kelupaan</h2>
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
              <Badge tone="brand" className="mb-4 w-fit border-teal-300/20 bg-teal-300/10 text-teal-100">Privasi & keamanan</Badge>
              <h2 className="text-3xl font-black">NEXA membantu mengingatkan, bukan mengakses akun kampusmu.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">{BRAND.disclaimer}</p>
            </div>
            <div className="grid gap-3">
              {[
                'NEXA tidak meminta password VClass, iLab, Studentsite, atau akun kampus lain',
                'NEXA tidak mengambil data dari sistem kampus tanpa izin',
                'Data yang disimpan hanya profil, deadline yang kamu masukkan sendiri, kontak reminder opsional, dan status paket',
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm leading-6 text-slate-300">
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
              <h2 className="mt-2 text-3xl font-black">Jawaban singkat untuk hal yang sering ditanyakan</h2>
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
              <h2 className="text-3xl font-black">Mulai dari NEXA Radar, gratis</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Catet deadline pertama, lihat mana yang paling dekat, lalu biasakan cek dashboard sebelum tugas menumpuk
              </p>
              <Link
                href="/login?mode=signup"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
              >
                Mulai Pakai Gratis
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
