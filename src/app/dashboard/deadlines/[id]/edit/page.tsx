import { notFound } from 'next/navigation'
import DeadlineForm from '@/components/DeadlineForm'
import { createClient } from '@/lib/supabase/server'
import type { AcademicDeadline, Profile } from '@/types'

export default async function EditDeadlinePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: profile }, { data: deadline }, { count }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('academic_deadlines').select('*').eq('id', params.id).eq('user_id', user!.id).maybeSingle(),
    supabase
      .from('academic_deadlines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .in('status', ['pending', 'in_progress', 'overdue']),
  ])

  if (!deadline) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-200">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(20,184,166,0.28),transparent_18rem)]" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Edit Deadline</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Benerin detail sebelum deadline benerin kamu.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Update data deadline, ubah status, atau hapus kalau memang sudah tidak relevan.
            </p>
          </div>
        </div>
      </div>
      <DeadlineForm profile={profile as Profile} deadline={deadline as AcademicDeadline} activeCount={count ?? 0} />
    </div>
  )
}
