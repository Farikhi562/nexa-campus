'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDisplayTitle, getUrgency, sortNearest } from '@/lib/deadline-utils'
import { getSourceLabel, getTypeLabel } from '@/lib/nexa-data'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { AcademicDeadline } from '@/types'

export default function DeadlineList({ deadlines }: { deadlines: AcademicDeadline[] }) {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState(() => [...deadlines].sort(sortNearest))
  const [busyId, setBusyId] = useState<string | null>(null)

  async function markComplete(deadline: AcademicDeadline) {
    setBusyId(deadline.id)
    const { error } = await supabase
      .from('academic_deadlines')
      .update({ status: deadline.status === 'completed' ? 'pending' : 'completed' })
      .eq('id', deadline.id)

    if (!error) {
      setItems((current) =>
        current.map((item) =>
          item.id === deadline.id
            ? { ...item, status: deadline.status === 'completed' ? 'pending' : 'completed' }
            : item
        )
      )
    }
    setBusyId(null)
  }

  async function remove(deadline: AcademicDeadline) {
    if (!confirm('Hapus deadline ini?')) return
    setBusyId(deadline.id)
    const { error } = await supabase.from('academic_deadlines').delete().eq('id', deadline.id)
    if (!error) setItems((current) => current.filter((item) => item.id !== deadline.id))
    setBusyId(null)
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-brand-200 bg-white/80 p-8 text-center shadow-xl shadow-slate-200/70">
        <p className="text-lg font-black text-slate-950">Belum ada deadline.</p>
        <p className="mt-2 text-sm text-slate-500">Entah hidupmu damai atau kamu belum nyatet.</p>
        <Link href="/dashboard/deadlines/new" className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5">
          Tambah Deadline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((deadline) => {
        const urgency = getUrgency(deadline)
        return (
          <div key={deadline.id} className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03] transition duration-200 hover:-translate-y-0.5 hover:shadow-slate-300/70 sm:p-5">
            <div className="flex items-start gap-3">
              <button
                onClick={() => markComplete(deadline)}
                disabled={busyId === deadline.id}
                className={`focus-ring mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl border transition ${
                  deadline.status === 'completed' ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-slate-200 bg-slate-50 text-transparent hover:border-brand-300 hover:bg-brand-50'
                }`}
                aria-label="Toggle complete"
              >
                <Check className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 truncate text-base font-black text-slate-950">{getDisplayTitle(deadline)}</h3>
                  <Badge tone={urgency.tone}>{urgency.label}</Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {deadline.deadline_date} • {deadline.deadline_time.slice(0, 5)} • {deadline.campus}, {deadline.room}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="brand">{getTypeLabel(deadline.type)}</Badge>
                  <Badge>{getSourceLabel(deadline.source)}</Badge>
                  <Badge tone={deadline.priority === 'urgent' || deadline.priority === 'high' ? 'warning' : 'neutral'}>{deadline.priority}</Badge>
                  <Badge tone={deadline.reminder_enabled ? 'success' : 'danger'}>{deadline.reminder_enabled ? 'Reminder on' : 'Belum ada reminder'}</Badge>
                  <Badge>{deadline.status}</Badge>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-1">
                <Link href={`/dashboard/deadlines/${deadline.id}/edit`} className="focus-ring rounded-2xl p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700" aria-label="Edit deadline">
                  <Pencil className="h-4 w-4" />
                </Link>
                <Button variant="ghost" className="min-h-0 p-2 text-red-600 hover:text-red-700" onClick={() => remove(deadline)} disabled={busyId === deadline.id} aria-label="Delete deadline">
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
