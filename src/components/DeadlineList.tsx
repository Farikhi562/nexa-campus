'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Loader2, Pencil, Search, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDisplayTitle, getUrgency, sortNearest } from '@/lib/deadline-utils'
import { getSourceLabel, getTypeLabel, DEADLINE_TYPES } from '@/lib/nexa-data'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import RecurringBadge from '@/components/deadlines/RecurringBadge'
import type { AcademicDeadline, DeadlineType, DeadlinePriority, DeadlineStatus } from '@/types'

type FilterStatus = 'all' | 'pending' | 'completed'
type FilterPriority = 'all' | DeadlinePriority

const STATUS_OPTIONS: Array<{ value: FilterStatus; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Belum selesai' },
  { value: 'completed', label: 'Selesai' },
]

const PRIORITY_OPTIONS: Array<{ value: FilterPriority; label: string }> = [
  { value: 'all', label: 'Semua prioritas' },
  { value: 'urgent', label: '🔴 Urgent' },
  { value: 'high', label: '🟠 High' },
  { value: 'normal', label: '🟡 Normal' },
  { value: 'low', label: '⚪ Low' },
]

function Pill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs font-black transition ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  )
}

export default function DeadlineList({ deadlines }: { deadlines: AcademicDeadline[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<AcademicDeadline[]>(() => [...deadlines].sort(sortNearest))
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  // ── Filter & search state ────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | DeadlineType>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all')

  // ── Bulk select state ────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() { setSelectedIds(new Set()) }

  // ── Filtered list (memoised) ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return items.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (statusFilter === 'pending' && d.status === 'completed') return false
      if (statusFilter === 'completed' && d.status !== 'completed') return false
      if (priorityFilter !== 'all' && d.priority !== priorityFilter) return false
      if (q) {
        const title = getDisplayTitle(d).toLowerCase()
        const course = d.course_name.toLowerCase()
        if (!title.includes(q) && !course.includes(q)) return false
      }
      return true
    })
  }, [items, query, typeFilter, statusFilter, priorityFilter])

  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      // deselect all currently visible
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((d) => next.delete(d.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filtered.forEach((d) => next.add(d.id))
        return next
      })
    }
  }

  const hasFilters = query !== '' || typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all'

  function resetFilters() {
    setQuery('')
    setTypeFilter('all')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  // ── Single actions ───────────────────────────────────────────────────────
  async function markComplete(deadline: AcademicDeadline) {
    setBusyId(deadline.id)
    const newStatus: DeadlineStatus = deadline.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase.from('academic_deadlines').update({ status: newStatus }).eq('id', deadline.id)
    if (!error) setItems((cur) => cur.map((d) => d.id === deadline.id ? { ...d, status: newStatus } : d))
    setBusyId(null)
  }

  async function remove(deadline: AcademicDeadline) {
    if (!confirm('Hapus deadline ini?')) return
    setBusyId(deadline.id)
    const { error } = await supabase.from('academic_deadlines').delete().eq('id', deadline.id)
    if (!error) { setItems((cur) => cur.filter((d) => d.id !== deadline.id)); selectedIds.delete(deadline.id) }
    setBusyId(null)
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────
  async function bulkMarkDone() {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    setBulkBusy(true)
    const { error } = await supabase.from('academic_deadlines').update({ status: 'completed' }).in('id', ids)
    if (!error) {
      setItems((cur) => cur.map((d) => ids.includes(d.id) ? { ...d, status: 'completed' as DeadlineStatus } : d))
      clearSelection()
    }
    setBulkBusy(false)
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds)
    if (!ids.length || !confirm(`Hapus ${ids.length} deadline yang dipilih?`)) return
    setBulkBusy(true)
    const { error } = await supabase.from('academic_deadlines').delete().in('id', ids)
    if (!error) { setItems((cur) => cur.filter((d) => !ids.includes(d.id))); clearSelection() }
    setBulkBusy(false)
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-brand-200 bg-white/80 p-8 text-center shadow-xl shadow-slate-200/70">
        <p className="text-lg font-black text-slate-950">Belum ada deadline.</p>
        <p className="mt-2 text-sm text-slate-500">Belum ada deadline yang tercatat.</p>
        <Link href="/dashboard/deadlines/new" className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5">
          Tambah Deadline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search + filter bar */}
      <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-200/70 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari matkul atau judul tugas..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter pills row */}
        <div className="flex flex-wrap gap-1.5">
          {/* Type pills */}
          <Pill active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}>Semua</Pill>
          {DEADLINE_TYPES.map((t) => (
            <Pill key={t.value} active={typeFilter === t.value} onClick={() => setTypeFilter(typeFilter === t.value ? 'all' : t.value)}>
              {t.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {/* Status + priority */}
          {STATUS_OPTIONS.map((s) => (
            <Pill key={s.value} active={statusFilter === s.value} onClick={() => setStatusFilter(s.value)}>{s.label}</Pill>
          ))}
          {PRIORITY_OPTIONS.slice(1).map((p) => (
            <Pill key={p.value} active={priorityFilter === p.value} onClick={() => setPriorityFilter(priorityFilter === p.value ? 'all' : p.value)}>{p.label}</Pill>
          ))}
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="flex items-center gap-1 rounded-2xl px-3 py-1.5 text-xs font-black text-slate-500 hover:text-red-600">
              <X className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Result count + select all */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">
            {filtered.length} dari {items.length} deadline
            {selectedIds.size > 0 && ` · ${selectedIds.size} dipilih`}
          </p>
          {filtered.length > 0 && (
            <button type="button" onClick={toggleSelectAll} className="text-xs font-black text-brand-600 hover:underline">
              {allFilteredSelected ? 'Batal pilih semua' : 'Pilih semua'}
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar — muncul kalau ada yang dipilih */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-30 flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 shadow-2xl shadow-slate-950/30">
          <p className="text-sm font-black text-white">{selectedIds.size} dipilih</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void bulkMarkDone()}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {bulkBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Selesaikan
            </button>
            <button
              type="button"
              onClick={() => void bulkDelete()}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-black text-white hover:bg-red-400 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus
            </button>
            <button type="button" onClick={clearSelection} className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty filtered state */}
      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center">
          <p className="font-black text-slate-700">Tidak ada deadline yang cocok.</p>
          <button type="button" onClick={resetFilters} className="mt-2 text-sm font-bold text-brand-600 hover:underline">Reset filter</button>
        </div>
      )}

      {/* List */}
      {filtered.map((deadline) => {
        const urgency = getUrgency(deadline)
        const isSelected = selectedIds.has(deadline.id)
        return (
          <div
            key={deadline.id}
            className={`rounded-3xl border bg-white/90 p-4 shadow-xl shadow-slate-200/70 ring-1 transition duration-200 hover:-translate-y-0.5 sm:p-5 ${
              isSelected
                ? 'border-brand-300 ring-brand-200/60'
                : 'border-white/80 ring-slate-950/[0.03]'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Bulk select checkbox */}
              <button
                type="button"
                onClick={() => toggleSelect(deadline.id)}
                className={`focus-ring mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${
                  isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 hover:border-brand-300'
                }`}
                aria-label="Pilih"
              >
                {isSelected && <Check className="h-3 w-3" />}
              </button>

              {/* Complete toggle */}
              <button
                onClick={() => void markComplete(deadline)}
                disabled={busyId === deadline.id}
                className={`focus-ring mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border transition ${
                  deadline.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-transparent hover:border-brand-300 hover:bg-brand-50'
                }`}
                aria-label="Toggle selesai"
              >
                {busyId === deadline.id
                  ? <Loader2 className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                  : <Check className="h-3.5 w-3.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`min-w-0 truncate text-base font-black text-slate-950 ${deadline.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                    {getDisplayTitle(deadline)}
                  </h3>
                  <Badge tone={urgency.tone}>{urgency.label}</Badge>
                  {deadline.is_recurring && <RecurringBadge dayOfWeek={deadline.recurrence_day_of_week} compact />}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {deadline.course_name} · {deadline.deadline_date} {deadline.deadline_time.slice(0, 5)} · {deadline.room}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{getTypeLabel(deadline.type)}</Badge>
                  <Badge>{getSourceLabel(deadline.source)}</Badge>
                  <Badge tone={deadline.priority === 'urgent' ? 'danger' : deadline.priority === 'high' ? 'warning' : 'neutral'}>
                    {deadline.priority}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-shrink-0 gap-1">
                <Link
                  href={`/dashboard/deadlines/${deadline.id}/edit`}
                  className="focus-ring rounded-2xl p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <Button
                  variant="ghost"
                  className="min-h-0 p-2 text-red-500 hover:text-red-600"
                  onClick={() => void remove(deadline)}
                  disabled={busyId === deadline.id}
                  aria-label="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
