import Link from 'next/link'
import { ArrowRight, BellRing, CalendarClock, CheckCircle2, LockKeyhole, Sparkles, TimerReset } from 'lucide-react'
import AuthStatusActions from '@/components/AuthStatusActions'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import NexaLogo from '@/components/NexaLogo'
import { BRAND } from '@/lib/brand'
import { PLANS } from '@/lib/nexa-data'

const SOURCES = ['VClass', 'iLab', 'Dosen langsung', 'Grup WA', 'Praktikum', 'Studentsite', 'BAAK', 'Lepkom']

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <NexaLogo className="h-10 w-10" />
            <div>
              <p className="text-lg font-black leading-5 text-slate-950">NEXA Campus</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">deadline radar</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            <a href="#fitur" className="hover:text-brand-700">Fitur</a>
            <Link href="/pricing" className="hover:text-brand-700">Pricing</Link>
            <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
          </nav>
          <AuthStatusActions />
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
            <div className="flex flex-col justify-center">
              <Badge tone="brand" className="mb-5 w-fit">MVP beta NEXA Tech Labs</Badge>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Platform anti-lupa deadline untuk mahasiswa.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                NEXA Campus bantu kamu mencatat, melihat, dan mengingat deadline tugas atau praktikum dari banyak sumber kampus dalam satu dashboard yang cepat dibaca.
              </p>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Deadline jangan diajak bercanda hari ini.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
                >
                  Daftar Beta
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  href="/login?mode=forgot"
                  className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  Lupa password
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">Deadline terdekat</p>
                    <p className="text-xs text-slate-500">Contoh dashboard NEXA</p>
                  </div>
                  <CalendarClock className="h-5 w-5 text-brand-700" />
                </div>
                <div className="space-y-3">
                  {[
                    ['Hari ini', 'Praktikum AOA', 'iLab', 'urgent'],
                    ['H-1', 'Tugas Algoritma', 'VClass', 'high'],
                    ['H-3', 'Kuis Matematika', 'Grup WA', 'normal'],
                  ].map(([urgency, title, source, priority]) => (
                    <div key={title} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <TimerReset className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-950">{title}</p>
                        <p className="text-xs text-slate-500">{source} • {priority}</p>
                      </div>
                      <Badge tone={urgency === 'Hari ini' ? 'danger' : 'warning'}>{urgency}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-950 p-4 text-white">
                  <BellRing className="mb-3 h-5 w-5 text-cyan-200" />
                  <p className="text-xl font-black">Reminder</p>
                  <p className="mt-1 text-xs text-slate-300">Pulse dan Command</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <LockKeyhole className="mb-3 h-5 w-5 text-brand-700" />
                  <p className="text-xl font-black text-slate-950">AI Preview</p>
                  <p className="mt-1 text-xs text-slate-500">Locked, jujur belum live</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl px-4 py-14">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Fokus MVP</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Satu pekerjaan: deadline kamu kelihatan.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Deadline Dashboard', 'Hari ini, minggu ini, terlambat, dan deadline tanpa reminder muncul jelas.'],
              ['Quick Add Deadline', 'Input manual yang ringkas untuk tugas, praktikum, kuis, ujian, pembayaran, dan lainnya.'],
              ['Reminder Settings', 'Atur channel Telegram dulu untuk testing. WhatsApp Wablas disiapkan sebagai roadmap produksi.'],
            ].map(([title, desc]) => (
              <Card key={title}>
                <CardContent>
                  <CheckCircle2 className="mb-4 h-5 w-5 text-brand-700" />
                  <h3 className="font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Sumber deadline</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Semua dicatat user, tanpa scraping.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                NEXA tidak meminta password kampus dan tidak mengambil data dari sistem kampus tanpa izin. Kamu cukup catat dari sumber yang kamu lihat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOURCES.map((source) => (
                <Badge key={source} tone="brand">{source}</Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => (
              <Card key={plan.id} className={plan.highlighted ? 'border-brand-300 ring-2 ring-brand-100' : ''}>
                <CardContent>
                  {plan.highlighted && <Badge tone="brand" className="mb-3">Target BEP: 20 user</Badge>}
                  <h3 className="text-lg font-black text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{plan.positioning}</p>
                  <p className="mt-5 text-3xl font-black text-slate-950">{plan.price}<span className="text-sm font-semibold text-slate-500">{plan.suffix}</span></p>
                  <ul className="mt-5 space-y-2 text-sm text-slate-600">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
                <p className="text-sm leading-6 text-slate-600">{BRAND.disclaimer}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
