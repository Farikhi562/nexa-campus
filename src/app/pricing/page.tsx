'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rp0',
    note: 'Mulai belajar tanpa bayar.',
    cta: 'Mulai Gratis',
    href: '/auth/login',
    featured: false,
    features: [
      '1 dokumen belajar',
      'Mock exam dasar',
      'Campus Tools demo',
      'Reminder agenda dasar',
      'Akses marketplace sebagai buyer',
    ],
    missing: ['Buka lapak marketplace', 'Telegram reminder otomatis', 'Study Room Pro'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 'Rp19.000',
    note: 'Untuk mahasiswa yang mulai serius.',
    cta: 'Bayar Basic via DOKU',
    href: '/checkout?plan=basic',
    featured: true,
    features: [
      '5 dokumen belajar',
      'Bisa jual barang dan jasa kampus',
      'Campus Tools Basic',
      'Export hasil belajar',
      'Priority support normal',
    ],
    missing: ['Dokumen unlimited', 'Telegram reminder otomatis'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp39.000',
    note: 'Paket lengkap untuk power user.',
    cta: 'Bayar Pro via DOKU',
    href: '/checkout?plan=pro',
    featured: false,
    features: [
      'Dokumen belajar unlimited',
      'Marketplace seller lengkap',
      'Telegram reminder otomatis',
      'Study Room dan leaderboard',
      'Campus Analytics dan AI Mentor',
    ],
    missing: [],
  },
]

const FAQ = [
  {
    q: 'Pembayaran pakai apa?',
    a: 'NEXA disiapkan untuk DOKU. User diarahkan ke checkout request agar admin bisa mengirim link pembayaran DOKU sesuai paket.',
  },
  {
    q: 'Siapa yang bisa jual barang dan jasa?',
    a: 'Akun Basic dan Pro bisa membuka lapak. Akun Free tetap bisa melihat listing dan menghubungi seller.',
  },
  {
    q: 'Setelah bayar, paket aktif kapan?',
    a: 'Untuk mode operasional awal, admin mengaktifkan paket setelah pembayaran DOKU terkonfirmasi. Ini aman untuk MVP dan penjualan awal.',
  },
]

export default function PricingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data as Profile | null)
    })
  }, [])

  function checkoutHref(plan: string) {
    const params = new URLSearchParams({ plan })
    if (profile?.email) params.set('email', profile.email)
    if (profile?.full_name) params.set('name', profile.full_name)
    return `/checkout?${params.toString()}`
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">NEXA</p>
              <p className="text-xs font-semibold text-slate-500">Campus Ecosystem</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
              Login
            </Link>
            <Link href="/contact" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
              Kontak Sales
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
            <CreditCard className="h-3.5 w-3.5" />
            DOKU payment ready
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Harga jelas, fitur siap dipakai, upgrade gampang.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600 md:text-lg">
            NEXA dibuat untuk dijual ke mahasiswa dengan model freemium. User bisa coba gratis, lalu upgrade saat butuh marketplace seller, reminder otomatis, Study Room, dan analytics.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border bg-white p-6 shadow-sm ${plan.featured ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">{plan.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{plan.note}</p>
                </div>
                {plan.featured && (
                  <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-black text-white">
                    Best value
                  </span>
                )}
              </div>
              <div className="mt-6">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-sm font-semibold text-slate-500"> / bulan</span>
              </div>
              <Link
                href={plan.id === 'free' ? plan.href : checkoutHref(plan.id)}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition ${plan.featured ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
              >
                {plan.id === 'free' ? <BookOpen className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                {plan.cta}
              </Link>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    {feature}
                  </div>
                ))}
                {plan.missing.map((feature) => (
                  <div key={feature} className="flex gap-3 text-sm leading-6 text-slate-400">
                    <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-10 md:grid-cols-4">
          {[
            { icon: ShieldCheck, title: 'RLS-ready', desc: 'Akses data dipisah per user lewat Supabase policy.' },
            { icon: Store, title: 'Monetizable', desc: 'Marketplace seller hanya untuk akun berbayar.' },
            { icon: MessageCircle, title: 'DOKU flow', desc: 'Checkout diarahkan ke request pembayaran DOKU.' },
            { icon: Lock, title: 'Freemium gate', desc: 'Free bisa coba, Basic/Pro membuka fitur bernilai.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <Icon className="h-6 w-6 text-brand-600" />
              <h3 className="mt-4 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-3xl font-black">FAQ sebelum bayar</h2>
          <div className="mt-6 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="flex items-center gap-2 font-black">
                  <HelpCircle className="h-4 w-4 text-brand-600" />
                  {item.q}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-lg border border-brand-200 bg-brand-50 p-6">
          <Sparkles className="h-8 w-8 text-brand-700" />
          <h2 className="mt-4 text-2xl font-black">Butuh paket kampus?</h2>
          <p className="mt-3 text-sm leading-6 text-brand-900">
            Untuk himpunan, kelas, atau komunitas mahasiswa, kamu bisa jual paket bulk manual dengan aktivasi admin.
          </p>
          <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700">
            <Users className="h-4 w-4" />
            Diskusi Paket
          </Link>
        </aside>
      </section>
    </main>
  )
}
