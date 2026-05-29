'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, Zap } from 'lucide-react'
import { BRAND } from '@/lib/brand'

const PLAN_DATA = {
  basic: { name: 'Basic', price: 'Rp19.000', value: 19000 },
  pro: { name: 'Pro', price: 'Rp39.000', value: 39000 },
}

function CheckoutContent() {
  const search = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contact, setContact] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paying, setPaying] = useState(false)

  const selectedPlan = search.get('plan') === 'pro' ? 'pro' : 'basic'
  const plan = PLAN_DATA[selectedPlan]

  useEffect(() => {
    setName(search.get('name') || '')
    setEmail(search.get('email') || '')
  }, [search])

  const manualPaymentLink = useMemo(() => {
    const message = [
      `Halo admin ${BRAND.companyName}, saya mau bayar paket ${plan.name} via ${BRAND.paymentProvider}.`,
      `Nama: ${name || '-'}`,
      `Email akun: ${email || '-'}`,
      `Kontak: ${contact || '-'}`,
      `Nominal: ${plan.price}`,
      `Mohon kirim link pembayaran ${BRAND.paymentProvider}.`,
    ].join('\n')
    return `https://t.me/NEXATchBot?text=${encodeURIComponent(message)}`
  }, [contact, email, name, plan.name, plan.price])

  async function requestMidtransPayment() {
    if (!name.trim() || !email.trim()) {
      setPaymentError(`Isi nama dan email akun ${BRAND.productName} dulu supaya aktivasi paket tidak salah akun.`)
      return
    }
    setPaymentError('')
    setPaying(true)

    try {
      const response = await fetch('/api/payments/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          name,
          email,
          whatsapp: contact,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.redirectUrl) {
        throw new Error(payload?.error || 'Gagal membuat transaksi Midtrans.')
      }

      window.location.href = payload.redirectUrl
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Gagal membuat transaksi Midtrans.')
      setPaying(false)
    }
  }

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
                <h1 className="text-2xl font-black">Checkout {BRAND.paymentProvider}</h1>
                <p className="text-sm text-slate-500">Isi data akun supaya admin {BRAND.companyName} bisa kirim link pembayaran yang benar.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nama lengkap</span>
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Nama kamu" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email akun {BRAND.productName}</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="nama@email.com" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">WhatsApp / Telegram</span>
                <input value={contact} onChange={(event) => setContact(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="0856... atau @username" />
              </label>
            </div>

            {paymentError && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {paymentError}
              </div>
            )}

            <button
              type="button"
              onClick={requestMidtransPayment}
              disabled={paying}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {paying ? 'Membuat transaksi...' : `Bayar dengan ${BRAND.paymentProvider}`}
            </button>

            <a href={manualPaymentLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex w-full justify-center text-sm font-bold text-brand-700 hover:underline">
              Minta link manual ke admin
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
                {[`Pembayaran via ${BRAND.paymentProvider}`, 'Aktivasi admin setelah pembayaran', 'Bisa upgrade/downgrade manual'].map((item) => (
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
                Pastikan email yang kamu isi sama dengan email login {BRAND.productName} agar aktivasi paket tidak salah akun.
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
