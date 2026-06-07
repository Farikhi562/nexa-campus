'use client'

import { useMemo, useState } from 'react'
import { BellRing, CheckCircle2, Send, ShieldCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Profile, ReminderPreferences } from '@/types'

type ReminderSettingsFormProps = {
  profile: Profile
  preferences?: Partial<ReminderPreferences> | null
  telegramConfigured: boolean
}

export default function ReminderSettingsForm({
  profile,
  preferences,
  telegramConfigured,
}: ReminderSettingsFormProps) {
  const supabase = useMemo(() => createClient(), [])
  const [telegramChatId, setTelegramChatId] = useState(profile.telegram_chat_id ?? '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? '')
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsapp_number ?? '')
  const [h7, setH7] = useState(preferences?.h7_enabled ?? false)
  const [h3, setH3] = useState(preferences?.h3_enabled ?? false)
  const [h1, setH1] = useState(preferences?.h1_enabled ?? true)
  const [day, setDay] = useState(preferences?.day_enabled ?? true)
  const [reminderTime, setReminderTime] = useState(preferences?.reminder_time?.slice(0, 5) ?? '08:00')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const cleanedTelegramChatId = telegramChatId.trim()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        telegram_chat_id: cleanedTelegramChatId || null,
        phone_number: phoneNumber.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
      })
      .eq('id', profile.id)

    if (profileError) {
      setLoading(false)
      setError('Kontak reminder gagal disimpan. Coba lagi sebentar.')
      return
    }

    const { error: preferenceError } = await supabase
      .from('reminder_preferences')
      .upsert({
        id: preferences?.id,
        user_id: profile.id,
        channel: 'telegram',
        h7_enabled: h7,
        h3_enabled: h3,
        h1_enabled: h1,
        day_enabled: day,
        reminder_time: reminderTime,
      })

    setLoading(false)

    if (preferenceError) {
      setError('Preferensi reminder gagal disimpan. Coba lagi sebentar.')
      return
    }

    setMessage('Pengaturan Telegram tersimpan. NEXA sudah siap ngingetin, asal chat ID benar.')
  }

  async function sendTestMessage() {
    setTesting(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/reminders/telegram/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramChatId: telegramChatId.trim() }),
    })
    const result = (await response.json().catch(() => null)) as { error?: string; message?: string } | null

    setTesting(false)

    if (!response.ok) {
      setError(result?.error || 'Test Telegram gagal dikirim.')
      return
    }

    setMessage(result?.message || 'Test Telegram terkirim. Cek chat kamu.')
  }

  return (
    <form onSubmit={saveSettings} className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone={telegramConfigured ? 'success' : 'warning'} className="mb-3">
              {telegramConfigured ? 'Telegram bot configured' : 'Telegram token belum kebaca'}
            </Badge>
            <h2 className="text-xl font-black text-slate-950">Telegram reminder</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Masukkan Telegram chat ID kamu. NEXA tidak butuh password kampus, cuma butuh chat ID untuk kirim reminder.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <BellRing className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Telegram chat ID</span>
            <input
              value={telegramChatId}
              onChange={(event) => setTelegramChatId(event.target.value)}
              placeholder="Contoh: 123456789"
              className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            <span className="mt-1.5 block text-xs leading-5 text-slate-500">
              Chat ID bisa didapat dari bot seperti @userinfobot, lalu mulai chat dengan bot NEXA.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Jam reminder default</span>
            <input
              type="time"
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Kapan NEXA harus ngingetin?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['H-7', h7, setH7],
            ['H-3', h3, setH3],
            ['H-1', h1, setH1],
            ['Hari-H', day, setDay],
          ].map(([label, checked, setter]) => (
            <label key={String(label)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)}
              />
              {String(label)}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Kontak opsional</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          WhatsApp masih roadmap. Nomor ini disimpan opsional untuk persiapan reminder produksi nanti.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">Nomor HP</span>
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-black text-slate-700">WhatsApp</span>
            <input
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
          </label>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={loading} className="min-h-12 rounded-2xl">
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={testing || !telegramChatId.trim()}
          onClick={sendTestMessage}
          className="min-h-12 rounded-2xl"
        >
          {testing ? 'Mengirim...' : 'Kirim Test Telegram'}
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-700" />
        <p>
          NEXA Campus bukan sistem resmi kampus. Reminder membantu, tapi info final tetap harus dicek dari kanal resmi kampus.
        </p>
      </div>
    </form>
  )
}
