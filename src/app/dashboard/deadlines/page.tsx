import Link from 'next/link'
import { Plus } from 'lucide-react'
import DeadlineList from '@/components/DeadlineList'
import { createClient } from '@/lib/supabase/server'
import { sortNearest } from '@/lib/deadline-utils'
import type { AcademicDeadline } from '@/types'

export default async function DeadlinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('academic_deadlines')
    .select('*')
    .eq('user_id', user!.id)
    .order('deadline_date', { ascending: true })
    .order('deadline_time', { ascending: true })

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/70 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <p className="text-sm font-black uppercase tracking-wide text-brand-700">Deadline Center</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Deadlines</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Semua tugas, ujian, praktikum, dan urusan kampus yang perlu kamu pantau.</p>
        </div>
          <Link href="/dashboard/deadlines/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-brand-500/20 transition hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </div>
      </div>
      <DeadlineList deadlines={((data ?? []) as AcademicDeadline[]).sort(sortNearest)} />
    </div>
  )
}
