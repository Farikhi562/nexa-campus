'use client'

import { useMemo, useState } from 'react'
import { CreditCard, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import type { Plan, Profile } from '@/types'

type SnapResult = { status_message?: string }
type SnapCallbacks = {
  onSuccess?: (result: SnapResult) => void
  onPending?: (result: SnapResult) => void
  onError?: (result: SnapResult) => void
  onClose?: () => void
}
declare global {
  interface Window {
    snap?: { pay: (token: string, callbacks?: SnapCallbacks) => void }
  }
}

const PLAN_PRICE: Record<Exclude<Plan, 'radar'>, string> = {
  pulse: 'Rp15.000',
  command: 'Rp25.000',
}

const PLAN_COPY: Record<Exclude<Plan, 'radar'>, { tagline: string; unlocks: string[]; nudge: string }> = {
  pulse: {
    tagline: 'Buat deadline yang perlu ngingetin kamu duluan.',
    unlocks: ['Deadline aktif lebih dari 5 item', 'Reminder H-1 dan hari-H', 'Weekly summary biar minggu depan kebaca'],
    nudge: 'Cocok kalau kamu mulai sering punya deadline paralel dari kelas, praktikum, dan organisasi.',
  },
  command: {
    tagline: 'Buat jadwal yang padat dan butuh kontrol lebih detail.',
    unlocks: ['Reminder H-7, H-3, H-1, dan hari-H', 'Jam reminder bisa kamu atur', 'Akses fitur beta lebih awal'],
    nudge: 'Cocok kalau satu reminder standar sudah kurang buat hidup akademikmu.',
  },
}

function loadSnapScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.snap) return resolve(true)
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    if (!clientKey) return resolve(false)
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    const src = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.snap)))
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.setAttribute('data-client-key', clientKey)
    script.onload = () => resolve(Boolean(window.snap))
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BillingIntentForm({ profile }: { profile: Profile }) {
  const supabase = useMemo(() => createClient(), [])
  const [plan, setPlan] = useState<Exclude<Plan, 'radar'>>('command')
  const [method, setMethod] = useState<'manual_transfer' | 'qris'>('qris')
  const [contactNote, setContactNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)

  async function payWithMidtrans() {
    setPaying(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/payments/midtrans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json().catch(() => null)) as
        | { token?: string; redirectUrl?: string; error?: string }
        | null

      if (!res.ok || !data?.token) {
        setError(data?.error || 'Pembayaran online belum tersedia. Coba metode manual.')
        return
      }

      const ready = await loadSnapScript()
      if (ready && window.snap) {
        window.snap.pay(data.token, {
          onSuccess: () => setMessage('Pembayaran berhasil! Plan kamu akan aktif otomatis dalam beberapa saat.'),
          onPending: () => setMessage('Pembayaran tertunda. Selesaikan pembayaran agar plan aktif.'),
          onError: () => setError('Pembayaran gagal. Coba lagi atau pakai metode manual.'),
          onClose: () => setMessage('Jendela pembayaran ditutup sebelum selesai.'),
        })
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        setError('Tidak bisa membuka halaman pembayaran. Pastikan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY diset.')
      }
    } catch {
      setError('Pembayaran gagal diproses. Coba lagi sebentar.')
    } finally {
      setPaying(false)
    }
  }

  async function submitManual() {
    setLoading(true)
    setError('')
    setMessage('')
    const { error: insertError } = await supabase.from('subscription_intents').insert({
      user_id: profile.id,
      requested_plan: plan,
      payment_method: method,
      contact_note: contactNote.trim() || null,
      status: 'pending',
    })
    setLoading(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setMessage('Intent upgrade terkirim. Admin akan konfirmasi manual sebelum plan berubah.')
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {(['pulse', 'command'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setPlan(id)}
            className={`focus-ring rounded-2xl border p-4 text-left transition ${
              plan === id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="font-black text-slate-950">{id === 'pulse' ? 'NEXA Pulse' : 'NEXA Command'}</p>
            <p className="mt-1 text-sm text-slate-500">{PLAN_PRICE[id]}/bulan</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{PLAN_COPY[id].tagline}</p>
            {profile.plan === id && <p className="mt-1 text-xs font-black text-emerald-600">Plan aktif kamu</p>}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-black text-amber-950">
          {profile.plan === 'radar'
            ? 'Radar masih bisa dipakai gratis. Upgrade cuma kalau kamu butuh reminder dan slot lebih lega.'
            : 'Kamu sudah upgrade. Command hanya perlu kalau butuh kontrol reminder yang lebih detail.'}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {PLAN_COPY[plan].unlocks.map((item) => (
            <div key={item} className="rounded-2xl border border-amber-200 bg-white/70 p-3 text-xs font-bold leading-5 text-amber-900">
              {item}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-amber-800">{PLAN_COPY[plan].nudge}</p>
      </div>

      {/* Bayar otomatis (Midtrans) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-300/10 text-teal-200">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-black">Bayar otomatis & instan</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Bayar via QRIS, e-wallet, atau transfer bank lewat Midtrans. Plan aktif otomatis setelah pembayaran terkonfirmasi.
            </p>
          </div>
        </div>
        <Button
          onClick={payWithMidtrans}
          disabled={paying || profile.plan === plan}
          className="mt-4 min-h-12 w-full rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {paying ? 'Menyiapkan pembayaran...' : `Bayar ${PLAN_PRICE[plan]} sekarang`}
        </Button>
      </div>

      {/* Manual fallback */}
      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-700">Atau ajukan upgrade manual</summary>
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold">
              <input type="radio" checked={method === 'qris'} onChange={() => setMethod('qris')} /> QRIS
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold">
              <input type="radio" checked={method === 'manual_transfer'} onChange={() => setMethod('manual_transfer')} /> Manual transfer
            </label>
          </div>
          <textarea
            value={contactNote}
            onChange={(event) => setContactNote(event.target.value)}
            rows={3}
            className="focus-ring w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            placeholder="Misal: sudah transfer, hubungi WA ini..."
          />
          <Button onClick={submitManual} disabled={loading || profile.plan === plan} variant="outline" className="rounded-2xl">
            {loading ? 'Mengirim...' : 'Ajukan Upgrade Manual'}
          </Button>
        </div>
      </details>

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
        Pembayaran diproses aman oleh Midtrans. NEXA tidak menyimpan data kartu/akun pembayaranmu.
      </p>

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    </div>
  )
}
