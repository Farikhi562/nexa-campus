'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, FileUp, Plus, Sparkles, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/EmptyState'
import { createClient } from '@/lib/supabase/client'
import type { ExamSchedule } from '@/types'

type ExtractedSchedule = { subject: string; type: string; date: string; notes?: string }

function daysLeft(date: string) {
  const target = new Date(date)
  const diff = Math.ceil((target.getTime() - Date.now()) / 86_400_000)
  return Math.max(0, diff)
}

function countdownClass(days: number) {
  if (days < 3) return 'border-red-200 bg-red-50 text-red-700'
  if (days < 7) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

export default function JadwalUjianPage() {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<ExamSchedule[]>([])
  const [suggested, setSuggested] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedSchedule[]>([])
  const [form, setForm] = useState({
    name: '',
    subject: '',
    type: 'UTS',
    exam_date: '',
    room: '',
    is_public: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/exam-schedules')
    const data = await res.json()
    setItems(data.data ?? [])
    setSuggested(data.suggested ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveSchedule(payload = form) {
    if (!payload.subject || !payload.exam_date) return
    setSaving(true)
    const res = await fetch('/api/exam-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: payload.name || payload.subject,
        type: payload.type,
        exam_date: payload.exam_date,
        room: payload.room,
        is_public: payload.is_public,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setForm({ name: '', subject: '', type: 'UTS', exam_date: '', room: '', is_public: false })
      load()
    }
  }

  async function extractPdf(file: File) {
    setExtracting(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/exam-schedules/extract', { method: 'POST', body: formData })
    const data = await res.json()
    setExtracted(data.data ?? [])
    setExtracting(false)
  }

  async function deleteSchedule(id: string) {
    await supabase.from('exam_schedules').delete().eq('id', id)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 lg:p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
              <CalendarClock className="h-4 w-4" />
              Jadwal Ujian
            </div>
            <h1 className="text-3xl font-black text-slate-950">Countdown UTS/UAS</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Tambah jadwal manual atau upload PDF kalender akademik untuk diekstrak Gemini.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={(event) => { event.preventDefault(); saveSchedule() }} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-black text-slate-950">Tambah manual</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama ujian, e.g. UTS Kalkulus 2" className="rounded-lg border px-4 py-3 text-sm" />
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mata kuliah" className="rounded-lg border px-4 py-3 text-sm" required />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border px-4 py-3 text-sm">
              <option>UTS</option>
              <option>UAS</option>
              <option>Quiz</option>
            </select>
            <input type="datetime-local" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="rounded-lg border px-4 py-3 text-sm" required />
            <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Ruangan (opsional)" className="rounded-lg border px-4 py-3 text-sm sm:col-span-2" />
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="mt-1" />
            Jadikan publik untuk membantu mahasiswa dari kampus yang sama.
          </label>
          <Button className="mt-5" loading={saving}>
            <Plus className="h-4 w-4" />
            Simpan Jadwal
          </Button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
            <Sparkles className="h-5 w-5 text-brand-600" />
            Extract dari PDF
          </h2>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-brand-300">
            <FileUp className="mb-2 h-8 w-8 text-brand-600" />
            <span className="text-sm font-bold text-slate-700">{extracting ? 'Gemini membaca PDF...' : 'Upload PDF kalender akademik'}</span>
            <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && extractPdf(e.target.files[0])} />
          </label>
        </div>
      </section>

      {extracted.length > 0 && (
        <section className="rounded-xl border border-brand-200 bg-brand-50 p-5">
          <h2 className="mb-4 text-lg font-black text-brand-950">Konfirmasi hasil Gemini</h2>
          <div className="grid gap-3">
            {extracted.map((item, index) => (
              <div key={`${item.subject}-${index}`} className="flex flex-col gap-3 rounded-lg bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-black text-slate-950">{item.type} {item.subject}</p>
                  <p className="text-sm text-slate-500">{item.date} {item.notes}</p>
                </div>
                <Button size="sm" onClick={() => saveSchedule({ name: item.subject, subject: item.subject, type: item.type, exam_date: item.date, room: '', is_public: false })}>
                  <Check className="h-4 w-4" />
                  Simpan
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-slate-500">Memuat jadwal...</div>
        ) : items.length === 0 ? (
          <EmptyState variant="reminders" title="Kamu belum punya reminder. Tambah deadline pertamamu!" actionLabel="Tambah Jadwal" onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const days = daysLeft(item.exam_date)
              return (
                <article key={item.id} className={`rounded-xl border p-5 ${countdownClass(days)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase opacity-70">{item.type}</p>
                      <h3 className="mt-1 text-lg font-black">{item.subject}</h3>
                      <p className="mt-2 text-sm">{new Date(item.exam_date).toLocaleString('id-ID')}</p>
                      {item.room && <p className="mt-1 text-sm">Ruangan: {item.room}</p>}
                    </div>
                    <button onClick={() => deleteSchedule(item.id)} className="rounded-lg p-2 hover:bg-white/60" aria-label="Hapus jadwal">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-5 text-2xl font-black">{item.type} {item.subject} — {days} hari lagi {days < 3 ? '🔴' : days < 7 ? '🟡' : '🟢'}</p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {suggested.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black text-slate-950">Saran dari kampusmu</h2>
          <div className="mt-4 grid gap-3">
            {suggested.map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                {item.type} {item.subject} - {new Date(item.exam_date).toLocaleDateString('id-ID')}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
