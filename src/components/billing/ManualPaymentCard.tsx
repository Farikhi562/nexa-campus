'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, CreditCard, ExternalLink, Loader2, QrCode, ShieldCheck, UploadCloud } from 'lucide-react'
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
  proof_url?: string | null
  rejection_reason?: string | null
  metadata?: {
    payment_label?: string
    payment_type?: 'bank_transfer' | 'qris'
    qr_image_url?: string
  } | null
  created_at?: string
  expires_at?: string | null
  approved_at?: string | null
}

function waLink(order: ManualOrder | null) {
  const phone = MANUAL_PAYMENT.confirmationWhatsapp.replace(/[^0-9]/g, '')
  if (!phone || !order) return ''
  const text = [
    'Halo admin NEXA, saya sudah melakukan pembayaran.',
    '',
    `Order Code: ${order.order_code}`,
    `Plan: ${BILLING_PLANS[order.plan].name}`,
    `Nominal: ${rupiah(order.amount)}`,
    `Metode: ${order.metadata?.payment_label || order.bank_name}`,
    `Nomor/QR: ${order.account_number}`,
  ].join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusClass(status: string) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'under_review') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (status === 'expired' || status === 'cancelled') return 'bg-slate-100 text-slate-500 border-slate-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

export default function ManualPaymentCard() {
  const [selectedPlan, setSelectedPlan] = useState<PaidBillingPlanId>('pulse')
  const [selectedMethod, setSelectedMethod] = useState<ManualPaymentMethodId>('bank_jago')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [proofLoading, setProofLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [order, setOrder] = useState<ManualOrder | null>(null)
  const [orders, setOrders] = useState<ManualOrder[]>([])
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [buyerName, setBuyerName] = useState('')
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('')
  const [notes, setNotes] = useState('')
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

  async function loadOrders() {
    setHistoryLoading(true)
    try {
      const response = await fetch('/api/billing/manual-payment', { cache: 'no-store' })
      const data = await response.json().catch(() => null)
      if (response.ok) setOrders(data?.orders ?? [])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

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
      setProofFile(null)
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal bikin order pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  async function submitProof(targetOrder: ManualOrder) {
    if (!proofFile) {
      setError('Pilih file bukti transfer dulu. Bukti gaib belum didukung, sayangnya.')
      return
    }

    setProofLoading(targetOrder.id)
    setError(null)
    try {
      const form = new FormData()
      form.append('proof', proofFile)
      form.append('buyer_name', buyerName)
      form.append('buyer_whatsapp', buyerWhatsapp)
      form.append('notes', notes)

      const response = await fetch(`/api/billing/manual-payment/${targetOrder.id}/proof`, {
        method: 'POST',
        body: form,
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Gagal upload bukti transfer.')
      setOrder(data.order)
      setProofFile(null)
      await loadOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal upload bukti transfer.')
    } finally {
      setProofLoading(null)
    }
  }

  const latestOrder = order || orders[0] || null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {(['pulse', 'command'] as const).map((planId) => {
          const plan = BILLING_PLANS[planId]
          const active = selectedPlan === planId
          return (
            <button
              key={planId}
              type="button"
              onClick={() => setSelectedPlan(planId)}
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
              Pilih Bank Jago atau BRI QRIS, upload bukti transfer, lalu admin approve dari dashboard. Akhirnya billing lu naik kelas dari “chat admin bang” ke sistem beneran.
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

        {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

        {latestOrder ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-teal-100 bg-teal-50/60 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Instruksi pembayaran</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-slate-400">Order ID</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="font-black text-slate-950">{latestOrder.order_code}</p>
                    <button onClick={() => copy(latestOrder.order_code, 'order')} className="text-teal-700" type="button">
                      {copied === 'order' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-slate-400">Nominal</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-2xl font-black text-slate-950">{rupiah(latestOrder.amount)}</p>
                    <button onClick={() => copy(String(latestOrder.amount), 'amount')} className="text-teal-700" type="button">
                      {copied === 'amount' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-xs font-bold text-slate-400">Metode pembayaran</p>
                  <p className="mt-1 font-black text-slate-950">{latestOrder.metadata?.payment_label || latestOrder.bank_name}</p>
                  <p className="text-sm font-bold text-slate-500">a.n. {latestOrder.account_name}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-mono text-lg font-black text-slate-950">{latestOrder.account_number}</p>
                    <button onClick={() => copy(latestOrder.account_number, 'account')} className="text-teal-700" type="button">
                      {copied === 'account' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {isQrisOrder && orderQrUrl ? (
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-xs font-bold text-slate-400">QR pembayaran</p>
                    <img src={orderQrUrl} alt="BRI QRIS / BRImo" className="mt-3 w-full rounded-2xl border border-slate-200 bg-white object-contain" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-black text-slate-950">Upload bukti transfer</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Setelah bayar, upload JPG/PNG/WEBP/PDF maksimal 5MB. Status otomatis jadi under review, admin tinggal approve dari `/admin/payments`.
              </p>

              <div className="mt-4 space-y-3">
                <input
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  placeholder="Nama pengirim / nama user"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                />
                <input
                  value={buyerWhatsapp}
                  onChange={(event) => setBuyerWhatsapp(event.target.value)}
                  placeholder="Nomor WhatsApp, contoh 62812xxxx"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                />
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Catatan opsional"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-teal-400"
                />
                <label className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-bold text-slate-500 transition hover:border-teal-400 hover:text-teal-700">
                  <UploadCloud className="mx-auto mb-2 h-5 w-5" />
                  {proofFile ? proofFile.name : 'Pilih file bukti transfer'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => submitProof(latestOrder)}
                  disabled={proofLoading === latestOrder.id || !['pending', 'under_review'].includes(latestOrder.status)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {proofLoading === latestOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  Upload bukti
                </button>
              </div>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:border-teal-300 hover:text-teal-700"
                >
                  Konfirmasi via WhatsApp <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  Env NEXT_PUBLIC_NEXA_PAYMENT_WHATSAPP belum diisi, jadi tombol WhatsApp belum muncul. Teknologi kalah sama nomor HP, klasik.
                </div>
              )}

              <div className="mt-4 rounded-2xl bg-white p-4 text-xs leading-5 text-slate-500">
                Status order:{' '}
                <span className={`inline-flex rounded-full border px-2 py-0.5 font-black ${statusClass(latestOrder.status)}`}>{latestOrder.status}</span>
                <br />Expired: <b>{formatDate(latestOrder.expires_at)}</b>
                {latestOrder.proof_url ? (
                  <>
                    <br />Bukti: <a className="font-black text-teal-700" href={latestOrder.proof_url} target="_blank" rel="noreferrer">lihat file</a>
                  </>
                ) : null}
                {latestOrder.rejection_reason ? <><br />Alasan reject: <b>{latestOrder.rejection_reason}</b></> : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-950">Riwayat billing</h3>
            <p className="mt-1 text-sm text-slate-500">User bisa cek status tanpa nanya admin tiap tiga menit. Peradaban naik satu tingkat.</p>
          </div>
          {historyLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Belum ada order.</div>
          ) : (
            orders.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-slate-950">{item.order_code}</p>
                  <p className="text-sm font-bold text-slate-500">{BILLING_PLANS[item.plan]?.name} · {rupiah(item.amount)} · {item.metadata?.payment_label || item.bank_name}</p>
                  <p className="text-xs text-slate-400">Dibuat {formatDate(item.created_at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(item.status)}`}>{item.status}</span>
                  {item.proof_url ? <a href={item.proof_url} target="_blank" rel="noreferrer" className="text-xs font-black text-teal-700">Lihat bukti</a> : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
