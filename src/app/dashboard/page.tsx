import DeadlineDashboardOverview from '@/components/dashboard/DeadlineDashboardOverview'
import { createClient } from '@/lib/supabase/server'
import { sortNearest } from '@/lib/deadline-utils'
import type { AcademicDeadline, Profile } from '@/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { created?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: deadlines, error }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase
      .from('academic_deadlines')
      .select('*')
      .eq('user_id', user!.id)
      .order('deadline_date', { ascending: true })
      .order('deadline_time', { ascending: true }),
  ])

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
        <p className="text-lg font-black">Dashboard gagal dimuat.</p>
        <p className="mt-2 text-sm leading-6">
          Ada masalah saat mengambil deadline kamu. Coba refresh sebentar lagi.
        </p>
      </div>
    )
  }

  return (
    <DeadlineDashboardOverview
      initialDeadlines={((deadlines ?? []) as AcademicDeadline[]).sort(sortNearest)}
      userName={(profile as Pick<Profile, 'full_name'> | null)?.full_name}
      showCreatedMessage={searchParams?.created === 'deadline'}
    />
  )
}
