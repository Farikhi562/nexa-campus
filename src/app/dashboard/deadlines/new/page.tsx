import { createClient } from '@/lib/supabase/server'
import DeadlineForm from '@/components/DeadlineForm'
import type { Profile } from '@/types'

export default async function NewDeadlinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase
      .from('academic_deadlines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .in('status', ['pending', 'in_progress', 'overdue']),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl shadow-slate-200">
        <div className="relative p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(20,184,166,0.28),transparent_18rem)]" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Quick Add Manual</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Tambah deadline cepet</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Catat dari VClass, iLab, dosen, grup WA, Studentsite, BAAK, Lepkom, atau sumber lain. Password kampus? Ngga usah
            </p>
          </div>
        </div>
      </div>
      <DeadlineForm profile={profile as Profile} activeCount={count ?? 0} />
    </div>
  )
}
