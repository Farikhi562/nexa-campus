'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Plus } from 'lucide-react'
import { DEADLINE_TYPES, PRIORITIES } from '@/lib/nexa-data'

/**
 * Form manual ringkas untuk SmartInputBox — field minimal sesuai brief
 * (mata kuliah, judul tugas, deadline, prioritas, catatan).
 * Submit lewat /api/smart-input/confirm (sama dengan jalur AI lainnya),
 * supaya konsisten + tercatat di smart_input_logs.
 */

const todayPlus = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function SmartManualForm({ defaultCampus }: { defaultCampus: string }) {
  const router = useRouter()
  const [courseName, setCourseName] = useState('')
  const [title, setTitle] = useState('')
  const [type, setType] = useState('tugas')
  const [date, setDate] = useState(todayPlus(1))
  const [time, setTime] = useState('23:59')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')
  const [online, setOnline] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function reset() {
    setCourseName('')
    setTitle('')
    setType('tugas')
    setDate(todayPlus(1))
    setTime('23:59')
    setPriority('normal')
    setNotes('')
    setOnline(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseName.trim() || !date) {
      setMessage({ type: 'err', text: 'Mata kuliah dan tanggal wajib diisi.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/smart-input/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType: 'manual',
          candidates: [
            {
              title: title.trim() || null,
              course_name: courseName.trim(),
              type,
              source: 'lainnya',
              deadline_date: date,
              deadline_time: time || '23:59',
              campus: defaultCampus,
              room: online ? 'Online' : 'Menyusul',
              notes: notes.trim() || null,
              priority,
              reminder_enabled: true,
            },
          ],
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.inserted?.length) {
        setMessage({ type: 'err', text: data?.errors?.[0]?.error || 'Gagal menyimpan. Coba lagi.' })
        return
      }

      setMessage({ type: 'ok', text: 'Tersimpan! Muncul di daftar deadline kamu.' })
      reset()
      router.refresh()
    } catch {
      setMessage({ type: 'err', text: 'Koneksi bermasalah. Coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-slate-600">Mata kuliah / kegiatan *</label>
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="mis. Kalkulus II"
            maxLength={120}
            className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-slate-600">Judul tugas (opsional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Laporan praktikum bab 3"
            maxLength={160}
            className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">Tanggal *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">Jam</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">Jenis</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800"
          >
            {DEADLINE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600">Prioritas</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-slate-600">Catatan (opsional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Instruksi tambahan, link, dll."
            maxLength={500}
            className="focus-ring w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 sm:col-span-2">
          <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="h-4 w-4 rounded accent-teal-600" />
          Online / daring (kalau tidak, ruangan diisi &quot;Menyusul&quot;)
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Simpan Deadline
      </button>

      {message && (
        <p className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-5 ${
          message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'ok' && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />}
          {message.text}
        </p>
      )}
    </form>
  )
}
