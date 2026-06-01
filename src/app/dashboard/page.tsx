import Link from 'next/link'
import { AlertTriangle, BellOff, CalendarDays, Plus, TimerReset, type LucideIcon } from 'lucide-react'
import DeadlineList from '@/components/DeadlineList'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { countDashboardStats, sortNearest } from '@/lib/deadline-utils'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { AcademicDeadline, Profile } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data } = await supabase
    .from('academic_deadlines')
    .select('*')
    .eq('user_id', user!.id)
    .neq('status', 'completed')
    .order('deadline_date', { ascending: true })
    .order('deadline_time', { ascending: true })

  const deadlines = ((data ?? []) as AcademicDeadline[]).sort(sortNearest)
  const stats = countDashboardStats(deadlines)
  const activeCount = deadlines.length
  const statCards: Array<{ label: string; value: number; icon: LucideIcon; copy: string }> = [
    { label: 'Hari Ini', value: stats.today, icon: CalendarDays, copy: 'Deadline jangan diajak bercanda hari ini.' },
    { label: 'Minggu Ini', value: stats.week, icon: TimerReset, copy: 'Pantau yang dekat dulu.' },
    { label: 'Terlambat', value: stats.overdue, icon: AlertTriangle, copy: 'Saatnya damage control.' },
    { label: 'Belum Ada Reminder', value: stats.noReminder, icon: BellOff, copy: 'NEXA bisa bantu ngingetin.' },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="info" className="mb-3">{PLAN_LABELS[(profile as Profile).plan]}</Badge>
          <h1 className="text-2xl font-black">Halo, {(profile as Profile).full_name || 'teman deadline'}.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Minggu ini ada {stats.week} deadline. Jangan sok kuat sendirian.
          </p>
        </div>
        <Link href="/dashboard/deadlines/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-bold text-white hover:bg-brand-400">
          <Plus className="h-4 w-4" />
          Quick Add
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, copy }) => (
          <Card key={label}>
            <CardContent>
              <Icon className="mb-4 h-5 w-5 text-brand-700" />
              <p className="text-3xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{copy}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {(profile as Profile).plan === 'radar' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Radar quota: {activeCount}/5 active deadlines. Upgrade kalau deadline-mu sudah mulai rame.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-950">Deadline terdekat</h2>
            <Link href="/dashboard/deadlines" className="text-sm font-bold text-brand-700">Lihat semua</Link>
          </div>
          <DeadlineList deadlines={deadlines.slice(0, 6)} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent>
              <Badge tone="brand" className="mb-3">Locked preview</Badge>
              <h3 className="font-black text-slate-950">AI Quick Add</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Paste teks dari VClass, iLab, atau grup WA. NEXA akan bantu ubah jadi deadline otomatis.
              </p>
              <Badge tone="neutral" className="mt-4">NEXA Command</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h3 className="font-black text-slate-950">Reminder reality check</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                NEXA bisa bantu ngingetin, tapi tugasnya tetap kamu yang ngerjain. Tragis, tapi adil.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
