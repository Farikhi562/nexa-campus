'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, CreditCard, ExternalLink, Loader2, QrCode, ShieldCheck } from 'lucide-react'
import {
  BILLING_PLANS,
  MANUAL_PAYMENT,
  MANUAL_PAYMENT_METHODS,
  type ManualPaymentMethodId,
  type PaidBillingPlanId,
  rupiah,
} from '@/lib/billing/plans'

type ManualOrder = {
  id: string
  order_code: string
  plan: PaidBillingPlanId
  amount: number
  status: string
  payment_method: ManualPaymentMethodId
  bank_name: string
  account_number: string
  account_name: string
  metadata?: {
    payment_label?: string
    payment_type?: 'bank_transfer' | 'qris'
    qr_image_url?: string
  } | null
  created_at?: string
  expires_at?: string | null
}

function waLink(order: ManualOrder | null) {
  const phone = MANUAL_PAYMENT.confirmationWhatsapp.replace(/[^0-9]/g, '')
  if (!phone || !order) return ''
  const text = [
    'Halo admin NEXA, saya sudah bayar untuk upgrade plan.',
    '',
    `Order: ${order.order_code}`,
    `Plan: ${BILLING_PLANS[order.plan].name}`,
    `Nominal: ${rupiah(order.amount)}`,
    `Metode: ${order.metadata?.payment_label || order.bank_name}`,
    `Nomor/QR: ${order.account_number}`,
  ].join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export default function ManualPaymentCard() {
  const [selectedPlan, setSelectedPlan] = useState<PaidBillingPlanId>('pulse')
  const [selectedMethod, setSelectedMethod] = useState<ManualPaymentMethodId>('bank_jago')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [order, setOrder] = useState<ManualOrder | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selected = BILLING_PLANS[selectedPlan]
  const currentMethod = MANUAL_PAYMENT_METHODS[selectedMethod]
  const whatsappUrl = useMemo(() => waLink(order), [order])
  const orderQrUrl = order?.metadata?.qr_image_url
  const isQrisOrder = order?.payment_method === 'bri_qris' || order?.metadata?.payment_type === 'qris'

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }

  async function createOrder() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/billing/manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, payment_method: selectedMethod }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Gagal bikin order pembayaran.')
      setOrder(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal bikin order pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {(['pulse', 'command'] as const).map((planId) => {
          const plan = BILLING_PLANS[planId]
          const active = selectedPlan === planId
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-3xl border p-5 text-left transition ${
                active ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-slate-200 bg-white hover:border-teal-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{plan.description}</p>
                </div>
                {active ? <Check className="h-5 w-5 text-teal-600" /> : null}
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-3xl font-black text-slate-950">{plan.priceLabel}</span>
                <span className="pb-1 text-sm font-bold text-slate-400">/{plan.period}</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {plan.features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-teal-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
              <CreditCard className="h-3.5 w-3.5" /> Manual payment sementara
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-950">Bayar {selected.name}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Midtrans dimatiin dulu. Untuk sekarang user bisa pilih Bank Jago transfer atau BRI QRIS/BRImo, terus admin approve manual.
              Startup mode warung, tapi setidaknya uangnya nyampe, tidak seperti niat belajar jam 2 pagi.
            </p>
          </div>
          <button
            type="button"
            onClick={createOrder}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Buat instruksi bayar
          </button>
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-black text-slate-950">Pilih metode pembayaran</p>
          <div className="grid gap-3 md:grid-cols-2">
            {(['bank_jago', 'bri_qris'] as const).map((methodId) => {
              const method = MANUAL_PAYMENT_METHODS[methodId]
              const active = selectedMethod === method.id
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`rounded-3xl border p-4 text-left transition ${
                    active ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-slate-200 bg-slate-50 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{method.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{method.instruction}</p>
                    </div>
                    {method.type === 'qris' ? <QrCode className="h-5 w-5 text-teal-700" /> : <CreditCard className="h-5 w-5 text-teal-700" />}
                  </div>
                  <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                    <b>{method.bankName}</b> · {method.accountNumber}
                    <br />a.n. {method.accountName}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            Metode aktif: <b>{currentMethod.label}</b>. Nominal tetap harus sesuai order: Pulse Rp18.000, Command Rp30.000.
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>
        ) : null}

        {order ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Instruksi pembayaran</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-slate-400">Order ID</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-black text-slate-950">{order.order_code}</p>
                    <button onClick={() => copy(order.order_code, 'order')} className="text-teal-700" type="button">
                      {copied === 'order' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-slate-400">Nominal</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-2xl font-black text-slate-950">{rupiah(order.amount)}</p>
                    <button onClick={() => copy(String(order.amount), 'amount')} className="text-teal-700" type="button">
                      {copied === 'amount' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-slate-400">Metode pembayaran</p>
                  <p className="mt-1 font-black text-slate-950">{order.metadata?.payment_label || order.bank_name}</p>
                  <p className="text-sm font-bold text-slate-500">a.n. {order.account_name}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-mono text-lg font-black text-slate-950">{order.account_number}</p>
                    <button onClick={() => copy(order.account_number, 'account')} className="text-teal-700" type="button">
                      {copied === 'account' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {isQrisOrder ? (
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-bold text-slate-400">QR BRI / BRImo</p>
                    {orderQrUrl ? (
                      <img
                        src={orderQrUrl}
                        alt="QR pembayaran BRI"
                        className="mt-3 w-full rounded-2xl border border-slate-200 bg-white object-contain"
                      />
                    ) : (
                      <p className="mt-2 text-sm font-bold text-amber-700">QR image belum diset. Isi NEXT_PUBLIC_BRI_QRIS_IMAGE_URL.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-black text-slate-950">Setelah bayar</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Simpan bukti transfer/QRIS, lalu kirim ke admin dengan Order ID. Kalau WhatsApp admin aktif, tombol di bawah otomatis bawa teks konfirmasi.
              </p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Konfirmasi via WhatsApp <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  Env NEXT_PUBLIC_NEXA_PAYMENT_WHATSAPP belum diisi, jadi tombol WhatsApp belum muncul. Teknologi kalah sama nomor HP, klasik.
                </div>
              )}
              <div className="mt-4 rounded-2xl bg-white p-4 text-xs leading-5 text-slate-500">
                Status order: <b>{order.status}</b>. Order expired 24 jam dari dibuat. Admin approve manual lewat endpoint admin.
              </div>
              {isQrisOrder ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                  Catatan: kalau QR yang dipasang masih QR BRImo dinamis, pastikan belum expired sebelum user bayar. Kalau sudah punya QRIS statis, ganti file di <b>/public/payment/bri-qris.jpg</b>.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
