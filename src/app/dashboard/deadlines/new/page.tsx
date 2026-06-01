import DeadlineForm from '@/components/DeadlineForm'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Quick Add Deadline</h1>
        <p className="mt-1 text-sm text-slate-500">Manual dulu. Cepat, jelas, tidak perlu buka banyak tab lagi.</p>
      </div>
      <Card>
        <CardContent>
          <DeadlineForm profile={profile as Profile} activeCount={count ?? 0} />
        </CardContent>
      </Card>
    </div>
  )
}
