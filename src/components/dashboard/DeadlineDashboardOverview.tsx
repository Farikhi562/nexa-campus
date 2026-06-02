'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertTriangle, BellOff, CalendarDays, Check, CheckCircle2, Clock, Flame, Plus, TimerReset } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import AskNexaWidget from '@/components/dashboard/AskNexaWidget'
import { createClient } from '@/lib/supabase/client'
import {
  countDashboardStats,
  formatDeadlineDate,
  formatDeadlineTime,
  getDisplayTitle,
  getPriorityTone,
  getStatusTone,
  getUrgency,
  sortNearest,
} from '@/lib/deadline-utils'
import { getSourceLabel, getTypeLabel } from '@/lib/nexa-data'
import type { AcademicDeadline } from '@/types'

type DeadlineDashboardOverviewProps = {
  initialDeadlines: AcademicDeadline[]
  userName?: string | null
  showCreatedMessage?: boolean
}

const summaryMeta = [
  {
    key: 'today',
    label: 'Hari Ini',
    icon: CalendarDays,
    copy: 'Deadline jangan diajak bercanda hari ini.',
    tone: 'text-red-600',
  },
  {
    key: 'week',
    label: 'Minggu Ini',
    icon: TimerReset,
    copy: 'Yang dekat dulu. Napas dulu juga boleh.',
    tone: 'text-cyan-700',
  },
  {
    key: 'overdue',
    label: 'Terlambat',
    icon: AlertTriangle,
    copy: 'Saatnya damage control yang elegan.',
    tone: 'text-amber-700',
  },
  {
    key: 'noReminder',
    label: 'Belum Ada Reminder',
    icon: BellOff,
    copy: 'Rawan kelupaan kalau cuma mengandalkan niat.',
    tone: 'text-slate-600',
  },
] as const

export default function DeadlineDashboardOverview({
  initialDeadlines,
  userName,
  showCreatedMessage = false,
}: DeadlineDashboardOverviewProps) {
  const supabase = useMemo(() => createClient(), [])
  const [deadlines, setDeadlines] = useState(() => [...initialDeadlines].sort(sortNearest))
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const stats = useMemo(() => countDashboardStats(deadlines), [deadlines])
  const activeDeadlines = deadlines.filter((deadline) => deadline.status !== 'completed')
  const nearestDeadline = activeDeadlines[0]
  const highPriorityCount = activeDeadlines.filter((deadline) =>
    deadline.priority === 'high' || deadline.priority === 'urgent'
  ).length

  async function markComplete(deadline: AcademicDeadline) {
    setBusyId(deadline.id)
    setActionError('')

    const { error } = await supabase
      .from('academic_deadlines')
      .update({ status: 'completed' })
      .eq('id', deadline.id)

    if (error) {
      setActionError(error.message)
      setBusyId(null)
      return
    }

    setDeadlines((current) =>
      current
        .map((item) => (item.id === deadline.id ? { ...item, status: 'completed' as const } : item))
        .sort(sortNearest)
    )
    setBusyId(null)
  }

  return (
    <div className="space-y-5">
      {showCreatedMessage && (
        <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>Deadline baru sudah masuk. Sekarang dia resmi kelihatan, jadi susah pura-pura lupa.</p>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-200">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(20,184,166,0.26),transparent_20rem)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge tone="info" className="mb-3">Deadline Radar</Badge>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {nearestDeadline
                  ? `${getDisplayTitle(nearestDeadline)} paling dekat.`
                  : `Halo${userName ? `, ${userName}` : ''}. Deadline aman dulu.`}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {nearestDeadline
                  ? `${formatDeadlineDate(nearestDeadline)}, ${formatDeadlineTime(nearestDeadline)} di ${nearestDeadline.campus} ${nearestDeadline.room}.`
                  : 'Belum ada deadline aktif. Entah hidupmu damai atau kamu belum nyatet.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
              {highPriorityCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
                  <Flame className="h-4 w-4" />
                  {highPriorityCount} prioritas tinggi
                </div>
              )}
              <Link
                href="/dashboard/deadlines/new"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300"
              >
                <Plus className="h-4 w-4" />
                Tambah Deadline
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMeta.map(({ key, label, icon: Icon, copy, tone }) => (
          <Card key={key} className="border-slate-200/80">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-3xl font-black text-slate-950">{stats[key]}</p>
                  <p className="mt-1 text-sm font-black text-slate-800">{label}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50">
                  <Icon className={`h-5 w-5 ${tone}`} />
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{copy}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {actionError}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Deadline terdekat</h2>
              <p className="mt-1 text-sm text-slate-500">Urut dari yang paling perlu dilihat dulu.</p>
            </div>
            <Badge tone={stats.today > 0 ? 'danger' : 'success'}>
              {stats.today > 0 ? 'Hari ini panas' : 'Hari ini aman'}
            </Badge>
          </div>
        </div>

        {deadlines.length === 0 ? (
          <div className="p-6 text-center sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-950">Belum ada deadline.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Entah hidupmu damai atau kamu belum nyatet.
            </p>
            <Link
              href="/dashboard/deadlines/new"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Deadline Pertama
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {deadlines.slice(0, 12).map((deadline) => {
              const urgency = getUrgency(deadline)
              const isDone = deadline.status === 'completed'

              return (
                <article key={deadline.id} className="p-4 transition hover:bg-slate-50/80 sm:p-5">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => markComplete(deadline)}
                      disabled={busyId === deadline.id || isDone}
                      className={`focus-ring mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border transition ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white text-transparent hover:border-teal-500 hover:text-teal-600'
                      }`}
                      aria-label={`Tandai ${getDisplayTitle(deadline)} selesai`}
                    >
                      <Check className="h-4 w-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`text-base font-black text-slate-950 ${isDone ? 'line-through decoration-slate-400' : ''}`}>
                              {getDisplayTitle(deadline)}
                            </h3>
                            <Badge tone={urgency.tone}>{urgency.label}</Badge>
                            <Badge tone={getPriorityTone(deadline.priority)}>{deadline.priority}</Badge>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-600">{deadline.course_name}</p>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 lg:flex-shrink-0">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{formatDeadlineDate(deadline)}</span>
                          <span className="text-slate-300">•</span>
                          <span>{formatDeadlineTime(deadline)}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="brand">{getTypeLabel(deadline.type)}</Badge>
                        <Badge>{getSourceLabel(deadline.source)}</Badge>
                        <Badge tone={getStatusTone(deadline.status)}>{deadline.status}</Badge>
                        <Badge tone={deadline.reminder_enabled ? 'success' : 'danger'}>
                          {deadline.reminder_enabled ? 'Reminder on' : 'Belum ada reminder'}
                        </Badge>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        Lokasi: <span className="font-bold text-slate-700">{deadline.campus} • {deadline.room}</span>
                        {deadline.location_note ? ` • ${deadline.location_note}` : ''}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(280px,0.42fr)]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm sm:p-5">
          <p className="font-black text-slate-950">Catatan kecil</p>
          <p className="mt-2">
            NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus.
          </p>
        </div>
        <AskNexaWidget />
      </section>
    </div>
  )
}
