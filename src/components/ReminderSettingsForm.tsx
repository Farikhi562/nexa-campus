'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import type { Profile, ReminderPreferences } from '@/types'

export default function ReminderSettingsForm({
  profile,
  preferences,
}: {
  profile: Profile
  preferences?: ReminderPreferences | null
}) {
  const supabase = useMemo(() => createClient(), [])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const locked = profile.plan === 'radar'

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (locked) {
      setError('Reminder aktif mulai dari NEXA Pulse. Radar tetap bisa pakai dashboard dan countdown.')
      return
    }

    setLoading(true)
    const form = new FormData(event.currentTarget)
    const payload = {
      user_id: profile.id,
      channel: String(form.get('channel') || 'telegram'),
      h7_enabled: form.get('h7_enabled') === 'on' && profile.plan === 'command',
      h3_enabled: form.get('h3_enabled') === 'on' && profile.plan === 'command',
      h1_enabled: form.get('h1_enabled') === 'on',
      day_enabled: form.get('day_enabled') === 'on',
      reminder_time: String(form.get('reminder_time') || '08:00'),
    }

    const { error: saveError } = await supabase.from('reminder_preferences').upsert(payload, {
      onConflict: 'user_id',
    })

    setLoading(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    setMessage('Reminder settings tersimpan. Kalau token Telegram belum diset, app tetap aman dan tidak crash.')
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className={locked ? 'pointer-events-none opacity-50' : ''}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Channel</span>
            <select name="channel" defaultValue={preferences?.channel ?? 'telegram'} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp (future Wablas)</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Jam reminder</span>
            <input name="reminder_time" type="time" defaultValue={preferences?.reminder_time?.slice(0, 5) ?? '08:00'} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['h7_enabled', 'H-7', profile.plan === 'command'],
            ['h3_enabled', 'H-3', profile.plan === 'command'],
            ['h1_enabled', 'H-1', true],
            ['day_enabled', 'Hari-H', true],
          ].map(([name, label, enabled]) => (
            <label key={String(name)} className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 ${enabled ? '' : 'opacity-50'}`}>
              <input
                type="checkbox"
                name={String(name)}
                disabled={!enabled}
                defaultChecked={Boolean(preferences?.[name as keyof ReminderPreferences])}
              />
              {String(label)}
              {!enabled && <span className="ml-auto text-xs text-slate-500">Command</span>}
            </label>
          ))}
        </div>
      </div>
      {locked && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Radar belum termasuk reminder. Upgrade ke Pulse kalau deadline perlu ngejar kamu.</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Reminder'}</Button>
    </form>
  )
}
