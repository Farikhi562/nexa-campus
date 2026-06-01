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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Deadlines</h1>
          <p className="mt-1 text-sm text-slate-500">Sort by nearest deadline.</p>
        </div>
        <Link href="/dashboard/deadlines/new" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" />
          Add
        </Link>
      </div>
      <DeadlineList deadlines={((data ?? []) as AcademicDeadline[]).sort(sortNearest)} />
    </div>
  )
}
