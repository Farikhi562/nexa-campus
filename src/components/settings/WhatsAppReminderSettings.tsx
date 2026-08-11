'use client'

import { useMemo, useState } from 'react'
import { MessageCircle, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type WhatsAppPrefs = {
  h7_enabled: boolean
  h3_enabled: boolean
  h1_enabled: boolean
  day_enabled: boolean
  reminder_time: string
}

type WhatsAppReminderSettingsProps = {
  userId: string
  waConfigured: boolean
  initialWhatsAppNumber?: string | null
  initialPreferences?: Partial<WhatsAppPrefs> | null
}

export default function WhatsAppReminderSettings({
  userId,
  waConfigured,
  initialWhatsAppNumber,
  initialPreferences,
}: WhatsAppReminderSettingsProps) {
  const supabase = useMemo(() => createClient(), [])
  const [whatsappNumber, setWhatsappNumber] = useState(initialWhatsAppNumber ?? '')
  const [h7, setH7] = useState(initialPreferences?.h7_enabled ?? false)
  const [h3, setH3] = useState(initialPreferences?.h3_enabled ?? false)
  const [h1, setH1] = useState(initialPreferences?.h1_enabled ?? true)
  const [day, setDay] = useState(initialPreferences?.day_enabled ?? true)
  const [reminderTime, setReminderTime] = useState(initialPreferences?.reminder_time?.slice(0, 5) ?? '08:00')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function save() {
    setSaving(true)
    setMessage(null)

    const cleaned = whatsappNumber.trim()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ whatsapp_number: cleaned || null })
      .eq('id', userId)

    const { error: prefError } = await supabase
      .from('reminder_preferences')
      .upsert(
        {
          user_id: userId,
          channel: 'whatsapp',
          h7_enabled: h7,
          h3_enabled: h3,
          h1_enabled: h1,
          day_enabled: day,
          reminder_time: reminderTime,
        },
        { onConflict: 'user_id,channel' }
      )

    setSaving(false)

    if (profileError || prefError) {
      setMessage({ type: 'err', text: 'Pengaturan WhatsApp gagal disimpan. Coba lagi sebentar.' })
      return
    }
    setMessage({ type: 'ok', text: 'Pengaturan WhatsApp tersimpan.' })
  }

  async function sendTest() {
    setTesting(true)
    setMessage(null)

    const response = await fetch('/api/reminders/whatsapp/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappNumber: whatsappNumber.trim() }),
    })
    const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null

    setTesting(false)

    if (!response.ok) {
      setMessage({ type: 'err', text: result?.error || 'Test WhatsApp gagal dikirim.' })
      return
    }
    setMessage({ type: 'ok', text: result?.message || 'Test WhatsApp terkirim. Cek chat kamu.' })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-black text-slate-950">Notifikasi WhatsApp</h3>
            {!waConfigured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                <AlertTriangle className="h-3 w-3" /> Gateway belum diaktifkan server
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Reminder deadline dikirim ke WhatsApp kamu lewat gateway pihak ketiga (Wablas) — bukan chatbot resmi Meta,
            jadi jangan simpan info sensitif di sini.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black text-slate-700">Nomor WhatsApp</span>
              <input
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="Contoh: 0812xxxxxxxx"
                className="focus-ring w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black text-slate-700">Jam kirim</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(event) => setReminderTime(event.target.value)}
                className="focus-ring w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ['H-7', h7, setH7],
              ['H-3', h3, setH3],
              ['H-1', h1, setH1],
              ['Hari-H', day, setDay],
            ].map(([label, checked, setter]) => (
              <label
                key={String(label)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked)}
                  onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)}
                />
                {String(label)}
              </label>
            ))}
          </div>

          {message && (
            <p
              className={`mt-3 flex items-start gap-1.5 rounded-xl px-3 py-2 text-xs leading-5 ${
                message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.type === 'ok' ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              )}
              {message.text}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Simpan Pengaturan WhatsApp
            </button>
            <button
              type="button"
              onClick={sendTest}
              disabled={testing || !whatsappNumber.trim() || !waConfigured}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Kirim Test WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
