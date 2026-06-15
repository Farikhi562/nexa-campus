'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, Trash2, X } from 'lucide-react'
import { DEADLINE_TYPES, PRIORITIES } from '@/lib/nexa-data'
import type { SmartInputCandidate } from '@/lib/smart-input/types'

type EditableCandidate = SmartInputCandidate & { _include: boolean }

type Props = {
  candidates: SmartInputCandidate[]
  source: 'ai' | 'fallback' | 'error'
  logId: string | null
  inputType: 'nlp' | 'image' | 'file'
  onDone: () => void
}

const sourceNote: Record<Props['source'], string> = {
  ai: '✨ Diproses AI — cek dulu sebelum simpan.',
  fallback: '⚙️ AI tidak aktif, dipakai pembaca pola sederhana — tolong cek tanggal & detailnya.',
  error: '',
}

export default function SmartInputPreview({ candidates, source, logId, inputType, onDone }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<EditableCandidate[]>(
    candidates.map((c) => ({ ...c, _include: true }))
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function update<K extends keyof SmartInputCandidate>(index: number, key: K, value: SmartInputCandidate[K]) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)))
  }

  function toggle(index: number) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, _include: !it._include } : it)))
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveAll() {
    const selected = items.filter((it) => it._include)
    if (selected.length === 0) {
      setMessage({ type: 'err', text: 'Pilih minimal 1 item untuk disimpan.' })
      return
    }
    for (const it of selected) {
      if (!it.course_name.trim()) {
        setMessage({ type: 'err', text: 'Mata kuliah/kegiatan tidak boleh kosong.' })
        return
      }
      if (!it.deadline_date) {
        setMessage({ type: 'err', text: 'Tanggal masih kosong di salah satu item — isi dulu (lihat label "Cek tanggal").' })
        return
      }
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/smart-input/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType,
          logId,
          candidates: selected.map((it) => ({
            title: it.title,
            course_name: it.course_name,
            type: it.type,
            source: it.source,
            deadline_date: it.deadline_date,
            deadline_time: it.deadline_time,
            campus: it.campus,
            room: it.room,
            notes: it.notes,
            priority: it.priority,
            reminder_enabled: it.reminder_enabled,
          })),
        }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.inserted?.length) {
        const firstErr = data?.errors?.[0]?.error
        setMessage({ type: 'err', text: firstErr || 'Gagal menyimpan. Coba lagi.' })
        return
      }

      const savedCount = data.inserted.length
      const failedCount = data.errors?.length || 0
      setMessage({
        type: 'ok',
        text: failedCount > 0
          ? `${savedCount} item tersimpan, ${failedCount} gagal (cek isiannya).`
          : `${savedCount} item tersimpan! Cek di daftar deadline kamu.`,
      })

      router.refresh()
      if (failedCount === 0) {
        setTimeout(onDone, 900)
      }
    } catch {
      setMessage({ type: 'err', text: 'Koneksi bermasalah. Coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
        Tidak ada item untuk ditampilkan.
        <button type="button" onClick={onDone} className="ml-2 font-bold text-teal-700 underline">
          Tutup
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-950">Preview — cek dulu sebelum simpan</h3>
          {sourceNote[source] && <p className="mt-0.5 text-xs text-slate-500">{sourceNote[source]}</p>}
        </div>
        <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Tutup preview">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const dateMissing = item.missing_fields.includes('deadline_date')
          const courseMissing = item.missing_fields.includes('course_name')

          return (
            <div
              key={i}
              className={`rounded-2xl border p-3 transition ${
                item._include ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input
                    type="checkbox"
                    checked={item._include}
                    onChange={() => toggle(i)}
                    className="h-4 w-4 rounded accent-teal-600"
                  />
                  Sertakan
                </label>
                <button type="button" onClick={() => remove(i)} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Hapus item">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={`mb-1 block text-[11px] font-bold ${courseMissing ? 'text-amber-600' : 'text-slate-500'}`}>
                    Mata kuliah / kegiatan {courseMissing && '— perlu dicek'}
                  </label>
                  <input
                    value={item.course_name}
                    onChange={(e) => update(i, 'course_name', e.target.value)}
                    className={`focus-ring min-h-10 w-full rounded-xl border px-3 py-2 text-sm text-slate-800 ${
                      courseMissing ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Judul tugas (opsional)</label>
                  <input
                    value={item.title ?? ''}
                    onChange={(e) => update(i, 'title', e.target.value || null)}
                    className="focus-ring min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className={`mb-1 block text-[11px] font-bold ${dateMissing ? 'text-amber-600' : 'text-slate-500'}`}>
                    Tanggal {dateMissing && '— perlu dicek'}
                  </label>
                  <input
                    type="date"
                    value={item.deadline_date ?? ''}
                    onChange={(e) => update(i, 'deadline_date', e.target.value || null)}
                    className={`focus-ring min-h-10 w-full rounded-xl border px-3 py-2 text-sm text-slate-800 ${
                      dateMissing ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Jam</label>
                  <input
                    type="time"
                    value={item.deadline_time}
                    onChange={(e) => update(i, 'deadline_time', e.target.value || '23:59')}
                    className="focus-ring min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Jenis</label>
                  <select
                    value={item.type}
                    onChange={(e) => update(i, 'type', e.target.value as SmartInputCandidate['type'])}
                    className="focus-ring min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {DEADLINE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Prioritas</label>
                  <select
                    value={item.priority}
                    onChange={(e) => update(i, 'priority', e.target.value as SmartInputCandidate['priority'])}
                    className="focus-ring min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Ruangan</label>
                  <input
                    value={item.room}
                    onChange={(e) => update(i, 'room', e.target.value)}
                    placeholder="Online / No. ruangan"
                    className="focus-ring min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold text-slate-500">Catatan</label>
                  <textarea
                    value={item.notes ?? ''}
                    onChange={(e) => update(i, 'notes', e.target.value || null)}
                    rows={2}
                    className="focus-ring w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  />
                </div>
              </div>

              {(dateMissing || courseMissing) && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-4 text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  Sistem tidak yakin dengan field bertanda kuning — tolong cek/lengkapi sebelum simpan.
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={saveAll}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Simpan Semua ({items.filter((i) => i._include).length})
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={loading}
          className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Batalkan
        </button>
      </div>

      {message && (
        <p className={`rounded-xl px-3 py-2 text-xs leading-5 ${
          message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
