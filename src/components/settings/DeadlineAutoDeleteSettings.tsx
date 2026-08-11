'use client'

import { useState } from 'react'
import { Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type DeadlineAutoDeleteSettingsProps = {
  userId: string
  initialEnabled: boolean
  initialDays: number
}

const DAY_OPTIONS = [
  { value: 0, label: 'Langsung, begitu tanggalnya lewat' },
  { value: 3, label: '3 hari setelah lewat' },
  { value: 7, label: '7 hari setelah lewat' },
  { value: 14, label: '14 hari setelah lewat' },
  { value: 30, label: '30 hari setelah lewat' },
]

export default function DeadlineAutoDeleteSettings({
  userId,
  initialEnabled,
  initialDays,
}: DeadlineAutoDeleteSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [days, setDays] = useState(initialDays)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function save(nextEnabled: boolean, nextDays: number) {
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        auto_delete_expired_deadlines: nextEnabled,
        auto_delete_expired_after_days: nextDays,
      })
      .eq('id', userId)

    setSaving(false)

    if (error) {
      setMessage({ type: 'err', text: 'Gagal menyimpan pengaturan. Coba lagi sebentar.' })
      return
    }

    setMessage({
      type: 'ok',
      text: nextEnabled
        ? `Aktif. Deadline yang sudah lewat akan otomatis terhapus ${nextDays === 0 ? 'begitu lewat tanggal' : `${nextDays} hari setelah lewat`}.`
        : 'Auto-hapus dimatikan. Deadline lama nggak akan terhapus otomatis.',
    })
  }

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    void save(next, days)
  }

  function handleDaysChange(value: number) {
    setDays(value)
    if (enabled) void save(enabled, value)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black text-slate-950">Hapus otomatis deadline yang sudah lewat</h3>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={handleToggle}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition disabled:opacity-50 ${
                enabled ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            Kalau aktif, deadline yang tanggalnya sudah lewat akan otomatis dihapus permanen dari daftar kamu — bukan cuma ditandai selesai.
          </p>

          {enabled && (
            <label className="mt-3 block max-w-xs">
              <span className="mb-1.5 block text-xs font-black text-slate-700">Hapus setelah</span>
              <select
                value={days}
                onChange={(event) => handleDaysChange(Number(event.target.value))}
                disabled={saving}
                className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm disabled:opacity-50"
              >
                {DAY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}

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

          {saving && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
            </p>
          )}

          <p className="mt-2 text-[11px] leading-4 text-slate-400">
            Default: mati. Kalau kamu nyalain, penghapusan bersifat permanen dan berjalan otomatis tiap hari — pastikan kamu sudah tandai deadline penting sebagai "selesai" dulu kalau masih mau disimpan.
          </p>
        </div>
      </div>
    </div>
  )
}
