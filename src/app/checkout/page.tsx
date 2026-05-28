'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, CreditCard, MessageCircle, ShieldCheck, Zap } from 'lucide-react'

const PLAN_DATA = {
  basic: { name: 'Basic', price: 'Rp15.000', value: 15000 },
  pro: { name: 'Pro', price: 'Rp25.000', value: 25000 },
}

function CheckoutContent() {
  const search = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const selectedPlan = search.get('plan') === 'pro' ? 'pro' : 'basic'
  const plan = PLAN_DATA[selectedPlan]

  const waLink = useMemo(() => {
    const message = [
      `Halo admin NEXA, saya mau bayar paket ${plan.name} via DOKU.`,
      `Nama: ${name || '-'}`,
      `Email akun: ${email || '-'}`,
      `WhatsApp: ${whatsapp || '-'}`,
      `Nominal: ${plan.price}`,
      'Mohon kirim link pembayaran DOKU.',
    ].join('\n')
    return `https://wa.me/?text=${encodeURIComponent(message)}`
  }, [email, name, plan.name, plan.price, whatsapp])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke pricing
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black">Checkout DOKU</h1>
                <p className="text-sm text-slate-500">Isi data akun supaya admin bisa kirim link pembayaran yang benar.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nama lengkap</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Nama kamu" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email akun NEXA</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="nama@email.com" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nomor WhatsApp</span>
                <input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="08xxxxxxxxxx" />
              </label>
            </div>

            <a href={waLink} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700">
              <MessageCircle className="h-4 w-4" />
              Minta Link Pembayaran DOKU
            </a>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-black">Paket {plan.name}</h2>
              </div>
              <p className="mt-4 text-4xl font-black">{plan.price}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">per bulan</p>
              <div className="mt-5 space-y-3">
                {['Pembayaran via DOKU', 'Aktivasi admin setelah pembayaran', 'Bisa upgrade/downgrade manual'].map((item) => (
                  <p key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <ShieldCheck className="h-6 w-6 text-amber-700" />
              <p className="mt-3 text-sm leading-6 text-amber-900">
                Pastikan email yang kamu isi sama dengan email login NEXA agar aktivasi paket tidak salah akun.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm font-semibold text-slate-600">Memuat checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
