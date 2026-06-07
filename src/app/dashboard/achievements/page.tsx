import { redirect } from 'next/navigation'
import AchievementsView from '@/components/dashboard/AchievementsView'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Pencapaian · NEXA Campus',
  description: 'Koleksi lencana NEXA Campus — buka dengan menyelesaikan deadline, menjaga streak, dan mengajak teman.',
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).maybeSingle()

  return <AchievementsView userPlan={(profile as { plan?: string } | null)?.plan as 'radar'|'pulse'|'command' ?? 'radar'} userId={user.id} />
}
