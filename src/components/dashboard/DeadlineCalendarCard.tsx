'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDeadlineTime, getDisplayTitle, getPriorityTone } from '@/lib/deadline-utils'
import type { AcademicDeadline, CalendarNote } from '@/types'

type NotesResponse = {
  data?: CalendarNote[]
  error?: string
  setupRequired?: boolean
}

const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

function dateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`)
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function getCalendarDays(cursor: Date) {
  const first = monthStart(cursor)
  const mondayOffset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

function monthRange(cursor: Date) {
  const days = getCalendarDays(cursor)
  return {
    from: dateValue(days[0]),
    to: dateValue(days[days.length - 1]),
  }
}

function monthLabel(cursor: Date) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cursor)
}

function longDateLabel(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseDate(value))
}

function groupByDate<T extends { note_date?: string; deadline_date?: string }>(
  items: T[],
  key: 'note_date' | 'deadline_date'
) {
  return items.reduce((map, item) => {
    const value = item[key]
    if (!value) return map
    const current = map.get(value) ?? []
    current.push(item)
    map.set(value, current)
    return map
  }, new Map<string, T[]>())
}

export default function DeadlineCalendarCard({ deadlines }: { deadlines: AcademicDeadline[] }) {
  const today = useMemo(() => dateValue(new Date()), [])
  const [cursor, setCursor] = useState(() => monthStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(today)
  const [notes, setNotes] = useState<CalendarNote[]>([])
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notesError, setNotesError] = useState('')
  const [setupRequired, setSetupRequired] = useState(false)
  const [noteTitle, setNoteTitle] = useState('Catatan')
  const [noteContent, setNoteContent] = useState('')

  const days = useMemo(() => getCalendarDays(cursor), [cursor])
  const range = useMemo(() => monthRange(cursor), [cursor])
  const deadlinesByDate = useMemo(() => groupByDate(deadlines, 'deadline_date'), [deadlines])
  const notesByDate = useMemo(() => groupByDate(notes, 'note_date'), [notes])
  const selectedDeadlines = deadlinesByDate.get(selectedDate) ?? []
  const selectedNotes = notesByDate.get(selectedDate) ?? []

  useEffect(() => {
    let active = true
    async function loadNotes() {
      setLoadingNotes(true)
      setNotesError('')
      try {
        const response = await fetch(`/api/calendar-notes?from=${range.from}&to=${range.to}`, { cache: 'no-store' })
        const result = (await response.json().catch(() => null)) as NotesResponse | null
        if (!active) return
        if (!response.ok) {
          setNotesError(result?.error || 'Catatan kalender belum bisa dimuat.')
          return
        }
        setSetupRequired(Boolean(result?.setupRequired))
        setNotes(result?.data ?? [])
      } catch {
        if (active) setNotesError('Catatan kalender gagal dimuat.')
      } finally {
        if (active) setLoadingNotes(false)
      }
    }
    void loadNotes()
    return () => { active = false }
  }, [range.from, range.to])

  function moveMonth(amount: number) {
    const next = addMonths(cursor, amount)
    setCursor(next)
    setSelectedDate(dateValue(next))
  }

  async function saveNote() {
    const content = noteContent.trim()
    const title = noteTitle.trim() || 'Catatan'
    if (!content || setupRequired) return

    setSavingNote(true)
    setNotesError('')
    try {
      const response = await fetch('/api/calendar-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_date: selectedDate,
          title,
          content,
        }),
      })
      const result = (await response.json().catch(() => null)) as { data?: CalendarNote; error?: string } | null
      if (!response.ok || !result?.data) {
        setNotesError(result?.error || 'Catatan gagal disimpan.')
        return
      }
      setNotes((current) => [...current, result.data!])
      setNoteTitle('Catatan')
      setNoteContent('')
    } catch {
      setNotesError('Catatan gagal disimpan.')
    } finally {
      setSavingNote(false)
    }
  }

  async function deleteNote(note: CalendarNote) {
    setDeletingId(note.id)
    setNotesError('')
    try {
      const response = await fetch(`/api/calendar-notes/${note.id}`, { method: 'DELETE' })
      const result = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        setNotesError(result?.error || 'Catatan gagal dihapus.')
        return
      }
      setNotes((current) => current.filter((item) => item.id !== note.id))
    } catch {
      setNotesError('Catatan gagal dihapus.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="overflow-hidden border-cyan-100 bg-white">
      <CardContent className="p-0">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-100">
                <CalendarDays className="h-3.5 w-3.5" />
                Kalender
              </div>
              <h2 className="mt-2 text-lg font-black text-slate-950">Deadline dan catatan harian</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Lihat beban bulan ini, pilih tanggal, lalu tambah notes pribadi kalau perlu.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-36 text-center text-sm font-black text-slate-900">{monthLabel(cursor)}</div>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)]">
          <div className="border-b border-slate-100 p-3 sm:p-4 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-7 gap-1">
              {dayLabels.map((label) => (
                <div key={label} className="px-1 py-2 text-center text-[11px] font-black uppercase tracking-wide text-slate-400">
                  {label}
                </div>
              ))}
              {days.map((day) => {
                const value = dateValue(day)
                const dayDeadlines = deadlinesByDate.get(value) ?? []
                const dayNotes = notesByDate.get(value) ?? []
                const activeCount = dayDeadlines.filter((deadline) => deadline.status !== 'completed').length
                const isSelected = selectedDate === value
                const isToday = today === value
                const outsideMonth = day.getMonth() !== cursor.getMonth()

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedDate(value)}
                    className={`focus-ring min-h-14 rounded-xl border p-1.5 text-left transition sm:min-h-24 sm:p-2 ${
                      isSelected
                        ? 'border-cyan-300 bg-cyan-50 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-cyan-200 hover:bg-cyan-50/40'
                    } ${outsideMonth ? 'opacity-45' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-black ${isToday ? 'text-cyan-700' : 'text-slate-700'}`}>
                        {day.getDate()}
                      </span>
                      {dayNotes.length > 0 && <StickyNote className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    <div className="mt-1 flex gap-1 sm:hidden">
                      {activeCount > 0 && <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                      {dayNotes.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    </div>
                    <div className="mt-2 hidden space-y-1 sm:block">
                      {activeCount > 0 && (
                        <span className="block rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-black text-white">
                          {activeCount} deadline
                        </span>
                      )}
                      {dayNotes.length > 0 && (
                        <span className="block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                          {dayNotes.length} notes
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Tanggal dipilih</p>
                <h3 className="mt-1 text-base font-black text-slate-950">{longDateLabel(selectedDate)}</h3>
              </div>
              <Badge tone={selectedDeadlines.length > 0 ? 'info' : 'neutral'}>
                {selectedDeadlines.length} deadline
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {selectedDeadlines.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  Belum ada deadline di tanggal ini.
                </div>
              ) : selectedDeadlines.map((deadline) => (
                <div key={deadline.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{getDisplayTitle(deadline)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{deadline.course_name} - {formatDeadlineTime(deadline)}</p>
                    </div>
                    <Badge tone={getPriorityTone(deadline.priority)}>{deadline.priority}</Badge>
                  </div>
                  {deadline.notes && (
                    <p className="mt-2 rounded-xl bg-slate-50 p-2 text-xs leading-5 text-slate-600">{deadline.notes}</p>
                  )}
                  <Link
                    href={`/dashboard/deadlines/${deadline.id}/edit`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-cyan-700 hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit deadline
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <StickyNote className="h-4 w-4 text-amber-500" />
                Notes pribadi
              </div>

              {loadingNotes ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-3 text-xs font-bold text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memuat notes...
                </div>
              ) : setupRequired ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Notes kalender butuh migration `calendar_notes` sebelum bisa dipakai.
                </p>
              ) : (
                <>
                  <div className="mt-3 space-y-2">
                    {selectedNotes.length === 0 ? (
                      <p className="rounded-xl bg-white p-3 text-xs leading-5 text-slate-500">Belum ada notes di tanggal ini.</p>
                    ) : selectedNotes.map((note) => (
                      <div key={note.id} className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-slate-900">{note.title}</p>
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{note.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteNote(note)}
                            disabled={deletingId === note.id}
                            className="focus-ring flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                            aria-label="Hapus note"
                          >
                            {deletingId === note.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 space-y-2">
                    <input
                      value={noteTitle}
                      onChange={(event) => setNoteTitle(event.target.value)}
                      maxLength={80}
                      className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                      placeholder="Judul notes"
                    />
                    <textarea
                      value={noteContent}
                      onChange={(event) => setNoteContent(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="focus-ring w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-700"
                      placeholder="Tulis catatan untuk tanggal ini..."
                    />
                    <button
                      type="button"
                      onClick={saveNote}
                      disabled={savingNote || !noteContent.trim()}
                      className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Simpan notes
                    </button>
                  </div>
                </>
              )}

              {notesError && <p className="mt-3 text-xs font-bold text-red-600">{notesError}</p>}
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  )
}
