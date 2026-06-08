import { redirect } from 'next/navigation'
import AchievementsView from '@/components/dashboard/AchievementsView'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'

export const metadata = {
  title: 'Pencapaian · NEXA Campus',
  description: 'Koleksi lencana NEXA Campus — buka dengan menyelesaikan deadline, menjaga streak, dan mengajak teman.',
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  return <AchievementsView userPlan={getEffectivePlan({ ...(profile ?? {}), email: user.email })} userId={user.id} />
}
