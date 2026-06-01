'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import type { Plan, Profile } from '@/types'

export default function BillingIntentForm({ profile }: { profile: Profile }) {
  const supabase = useMemo(() => createClient(), [])
  const [plan, setPlan] = useState<Exclude<Plan, 'radar'>>('command')
  const [method, setMethod] = useState<'manual_transfer' | 'qris'>('qris')
  const [contactNote, setContactNote] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
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
    setMessage('Intent upgrade terkirim. Admin akan confirm manual sebelum plan berubah.')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPlan('pulse')}
          className={`rounded-lg border p-4 text-left ${plan === 'pulse' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}
        >
          <p className="font-black text-slate-950">NEXA Pulse</p>
          <p className="mt-1 text-sm text-slate-500">Rp15.000/bulan</p>
        </button>
        <button
          type="button"
          onClick={() => setPlan('command')}
          className={`rounded-lg border p-4 text-left ${plan === 'command' ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}
        >
          <p className="font-black text-slate-950">NEXA Command</p>
          <p className="mt-1 text-sm text-slate-500">Rp25.000/bulan</p>
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold">
          <input type="radio" checked={method === 'qris'} onChange={() => setMethod('qris')} />
          QRIS
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold">
          <input type="radio" checked={method === 'manual_transfer'} onChange={() => setMethod('manual_transfer')} />
          Manual transfer
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">Catatan kontak opsional</span>
        <textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} rows={3} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Misal: sudah transfer, hubungi WA ini..." />
      </label>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <Button onClick={submit} disabled={loading || profile.plan === plan}>{loading ? 'Mengirim...' : 'Ajukan Upgrade'}</Button>
    </div>
  )
}
