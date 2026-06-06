'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, ImageUp, LockKeyhole, Sparkles, Wand2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { DEADLINE_SOURCES, DEADLINE_TYPES, PRIORITIES } from '@/lib/nexa-data'
import type { DeadlinePriority, DeadlineSource, DeadlineType, Plan } from '@/types'

type ExtractedDeadline = {
  title: string
  course_name: string
  type: DeadlineType
  source: DeadlineSource
  deadline_date: string
  deadline_time: string
  campus: string
  room: string
  notes: string
  priority: DeadlinePriority
  reminder_enabled: boolean
}

type AiItem = {
  title?: unknown
  category?: unknown
  due_date?: unknown
  priority?: unknown
  source?: unknown
  notes?: unknown
}

type ExtractResponse = {
  data?: AiItem[]
  rawResponse?: string
  answer?: string
  error?: string
  status?: 'success' | 'locked' | 'parse_failed'
}

const typeValues = new Set(DEADLINE_TYPES.map((item) => item.value))
const sourceValues = new Set(DEADLINE_SOURCES.map((item) => item.value))
const priorityValues = new Set(PRIORITIES.map((item) => item.value))

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeType(value: unknown): DeadlineType {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === 'assignment') return 'tugas'
  if (normalized === 'practicum') return 'praktikum'
  if (normalized === 'quiz') return 'kuis'
  if (normalized === 'exam') return 'ujian'
  if (normalized === 'payment') return 'pembayaran'
  return typeValues.has(normalized as DeadlineType) ? (normalized as DeadlineType) : 'lainnya'
}

function normalizePriority(value: unknown): DeadlinePriority {
  const normalized = normalizeText(value).toLowerCase()
  return priorityValues.has(normalized as DeadlinePriority)
    ? (normalized as DeadlinePriority)
    : 'normal'
}

function normalizeSource(value: unknown): DeadlineSource {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized.includes('vclass')) return 'vclass'
  if (normalized.includes('ilab')) return 'ilab'
  if (normalized.includes('dosen')) return 'dosen_langsung'
  if (normalized.includes('wa') || normalized.includes('whatsapp')) return 'grup_wa'
  if (normalized.includes('praktikum')) return 'praktikum'
  if (normalized.includes('studentsite')) return 'studentsite'
  if (normalized.includes('baak')) return 'baak'
  if (normalized.includes('lepkom')) return 'lepkom'
  return sourceValues.has(normalized as DeadlineSource) ? (normalized as DeadlineSource) : 'lainnya'
}

function parseDueDate(value: unknown) {
  const raw = normalizeText(value)
  if (!raw) return { date: '', time: '23:59' }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { date: raw, time: '23:59' }
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '23:59' }

  const date = [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-')
  const time = `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`
  return { date, time: time === '00:00' ? '23:59' : time }
}

function makeEditableDeadline(item: AiItem, fallbackCampus: string): ExtractedDeadline {
  const title = normalizeText(item.title)
  const { date, time } = parseDueDate(item.due_date)
  const type = normalizeType(item.category)

  return {
    title,
    course_name: title || 'Deadline Kampus',
    type,
    source: normalizeSource(item.source),
    deadline_date: date,
    deadline_time: time,
    campus: fallbackCampus,
    room: 'Online',
    notes: normalizeText(item.notes),
    priority: normalizePriority(item.priority),
    reminder_enabled: false,
  }
}

function updateItem<T extends keyof ExtractedDeadline>(
  items: ExtractedDeadline[],
  index: number,
  key: T,
  value: ExtractedDeadline[T]
) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
}

export default function AIQuickAddDeadline({
  plan,
  campusName,
}: {
  plan: Plan
  campusName?: string | null
}) {
  const isLocked = plan === 'radar'
  const fallbackCampus = campusName?.trim() || 'Kampus'
  const [rawText, setRawText] = useState('')
  const [items, setItems] = useState<ExtractedDeadline[]>([])
  const [rawResponse, setRawResponse] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractingImage, setExtractingImage] = useState(false)
  const [saving, setSaving] = useState(false)

  const canSave = useMemo(
    () =>
      items.length > 0 &&
      items.every(
        (item) =>
          item.course_name.trim() &&
          item.deadline_date &&
          item.deadline_time &&
          item.campus.trim() &&
          item.room.trim()
      ),
    [items]
  )

  function applyExtractResult(result: ExtractResponse | null, ok: boolean) {
    if (!ok || !result) {
      setError(result?.error || 'AI gagal membaca. Coba lagi sebentar.')
      if (result?.rawResponse) setRawResponse(result.rawResponse)
      return false
    }
    if (result.status === 'locked') {
      setError(result.error || result.answer || 'Fitur AI belum aktif.')
      return false
    }
    if (!result.data?.length) {
      setError(
        'Belum ada deadline yang bisa diekstrak. Coba teks/foto yang lebih jelas, atau tambah manual.'
      )
      if (result.rawResponse) setRawResponse(result.rawResponse)
      return false
    }
    setItems(result.data.map((item) => makeEditableDeadline(item, fallbackCampus)))
    setMessage(
      'Hasil AI sudah jadi preview. Cek dulu sebelum disimpan, karena keputusan final tetap di kamu.'
    )
    return true
  }

  async function extractFromImage(file: File) {
    setError('')
    setMessage('')
    setRawResponse('')

    if (file.size > 5 * 1024 * 1024) {
      setError('Gambar terlalu besar. Maksimal 5MB.')
      return
    }

    setExtractingImage(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('read_failed'))
        reader.readAsDataURL(file)
      })

      const response = await fetch('/api/deadlines/ai-extract-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
      })
      const result = (await response.json().catch(() => null)) as ExtractResponse | null
      applyExtractResult(result, response.ok)
    } catch {
      setError('Gagal memproses gambar. Coba foto lain.')
    } finally {
      setExtractingImage(false)
    }
  }

  async function extractDeadlines() {
    setError('')
    setMessage('')
    setRawResponse('')

    if (!rawText.trim()) {
      setError('Paste info deadline dulu ya.')
      return
    }

    setExtracting(true)
    const response = await fetch('/api/deadlines/ai-extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
    })
    const result = (await response.json().catch(() => null)) as ExtractResponse | null
    setExtracting(false)

    if (!response.ok || !result) {
      setError(result?.error || 'AI Quick Add gagal membaca teks. Coba lagi sebentar.')
      if (result?.rawResponse) setRawResponse(result.rawResponse)
      return
    }

    if (result.status === 'locked') {
      setError(result.answer || 'AI Quick Add belum aktif karena konfigurasi AI belum tersedia.')
      return
    }

    if (!result.data?.length) {
      setError(
        'Belum ada deadline yang bisa diekstrak. Kamu bisa edit raw response atau tambah manual.'
      )
      if (result.rawResponse) setRawResponse(result.rawResponse)
      return
    }

    setItems(result.data.map((item) => makeEditableDeadline(item, fallbackCampus)))
    setMessage(
      'Hasil AI sudah jadi preview. Cek dulu sebelum disimpan, karena keputusan final tetap di kamu.'
    )
  }

  async function saveAll() {
    setError('')
    setMessage('')

    if (!canSave) {
      setError(
        'Lengkapi mata kuliah/kegiatan, tanggal, jam, kampus, dan ruangan di semua card dulu.'
      )
      return
    }

    setSaving(true)
    for (const item of items) {
      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title.trim() || null,
          course_name: item.course_name.trim(),
          type: item.type,
          source: item.source,
          deadline_date: item.deadline_date,
          deadline_time: item.deadline_time,
          campus: item.campus.trim(),
          room: item.room.trim(),
          location_note: null,
          notes: item.notes.trim() || null,
          status: 'pending',
          priority: item.priority,
          reminder_enabled: item.reminder_enabled,
        }),
      })
      const result = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        setSaving(false)
        setError(result?.error || 'Sebagian deadline gagal disimpan. Cek lagi datanya ya.')
        return
      }
    }

    setSaving(false)
    setMessage('Semua deadline berhasil disimpan. Dashboard kamu sekarang lebih susah diajak lupa.')
    setRawText('')
    setItems([])
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={isLocked ? 'pointer-events-none select-none blur-[2px]' : ''}>
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge tone="brand" className="mb-3">
                AI Quick Add
              </Badge>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">
                Paste teks atau foto, jadi draft deadline.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Tempel teks dari grup WA/VClass, atau upload foto papan tulis & screenshot jadwal —
                NEXA ubah jadi draft. NEXA tidak login ke sistem kampus mana pun.
              </p>
            </div>
            <Badge tone="info">Gemini Beta</Badge>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-slate-800">
              Paste info dari grup WA, VClass, atau catatan dosen
            </span>
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={8}
              className="focus-ring w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400"
              placeholder="Contoh: Reminder praktikum AOA dikumpulkan Jumat 21 Juni jam 23.59 via iLab..."
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={extractDeadlines}
              disabled={extracting || extractingImage || saving}
              className="min-h-12 rounded-2xl"
            >
              {extracting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {extracting ? 'NEXA lagi baca...' : 'Extract dari Teks'}
            </Button>
            <label className="focus-ring inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
              {extractingImage ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              ) : (
                <ImageUp className="h-4 w-4 text-teal-700" />
              )}
              {extractingImage ? 'Membaca foto...' : 'Upload Foto Jadwal'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={extracting || extractingImage || saving}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) extractFromImage(file)
                  event.target.value = ''
                }}
              />
            </label>
            <Link
              href="/dashboard/deadlines/new"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Input manual
            </Link>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              {message}
            </div>
          )}

          {rawResponse && (
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-800">
                Raw response AI, bisa kamu edit manual
              </span>
              <textarea
                value={rawResponse}
                onChange={(event) => setRawResponse(event.target.value)}
                rows={6}
                className="focus-ring w-full resize-y rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
              />
            </label>
          )}

          {items.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Preview hasil extract</h2>
                  <p className="text-sm text-slate-500">
                    Edit dulu kalau ada tanggal, kategori, atau sumber yang kurang pas.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={saveAll}
                  disabled={saving || !canSave}
                  className="min-h-12 rounded-2xl"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Semua'}
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((item, index) => (
                  <article
                    key={`${item.title}-${index}`}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="font-black text-slate-950">Draft #{index + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setItems((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                        className="rounded-full px-3 py-1 text-xs font-black text-red-700 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="mb-1 block text-xs font-black text-slate-600">Judul</span>
                        <input
                          value={item.title}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'title', event.target.value)
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1 block text-xs font-black text-slate-600">
                          Mata kuliah / kegiatan
                        </span>
                        <input
                          value={item.course_name}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'course_name', event.target.value)
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                          required
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black text-slate-600">
                          Kategori
                        </span>
                        <select
                          value={item.type}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'type', event.target.value as DeadlineType)
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        >
                          {DEADLINE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black text-slate-600">Sumber</span>
                        <select
                          value={item.source}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(
                                current,
                                index,
                                'source',
                                event.target.value as DeadlineSource
                              )
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        >
                          {DEADLINE_SOURCES.map((source) => (
                            <option key={source.value} value={source.value}>
                              {source.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black text-slate-600">
                          Tanggal
                        </span>
                        <input
                          type="date"
                          value={item.deadline_date}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'deadline_date', event.target.value)
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black text-slate-600">Jam</span>
                        <input
                          type="time"
                          value={item.deadline_time}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'deadline_time', event.target.value)
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black text-slate-600">
                          Prioritas
                        </span>
                        <select
                          value={item.priority}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(
                                current,
                                index,
                                'priority',
                                event.target.value as DeadlinePriority
                              )
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        >
                          {PRIORITIES.map((priority) => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black text-slate-600">Kampus</span>
                        <input
                          value={item.campus}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'campus', event.target.value)
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-xs font-black text-slate-600">
                          Ruangan
                        </span>
                        <input
                          value={item.room}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'room', event.target.value)
                            )
                          }
                          className="focus-ring w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1 block text-xs font-black text-slate-600">Notes</span>
                        <textarea
                          value={item.notes}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'notes', event.target.value)
                            )
                          }
                          rows={3}
                          className="focus-ring w-full resize-y rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                        />
                      </label>
                      <label className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={item.reminder_enabled}
                          onChange={(event) =>
                            setItems((current) =>
                              updateItem(current, index, 'reminder_enabled', event.target.checked)
                            )
                          }
                          className="mt-0.5"
                        />
                        Butuh reminder
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/75 p-4 backdrop-blur-sm">
          <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <Badge tone="brand" className="mb-3">
              Pulse & Command
            </Badge>
            <h2 className="text-xl font-black text-slate-950">
              AI Quick Add terkunci untuk Radar.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upgrade ke Pulse atau Command untuk extract deadline otomatis dari teks yang kamu
              paste manual.
            </p>
            <Link
              href="/pricing"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700"
            >
              Lihat Upgrade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
