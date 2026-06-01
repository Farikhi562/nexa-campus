import { notFound } from 'next/navigation'
import DeadlineForm from '@/components/DeadlineForm'
import { Card, CardContent } from '@/components/ui/Card'
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Edit Deadline</h1>
        <p className="mt-1 text-sm text-slate-500">Benerin detail sebelum deadline benerin kamu.</p>
      </div>
      <Card>
        <CardContent>
          <DeadlineForm profile={profile as Profile} deadline={deadline as AcademicDeadline} activeCount={count ?? 0} />
        </CardContent>
      </Card>
    </div>
  )
}
