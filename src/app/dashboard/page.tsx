import DeadlineDashboardOverview from '@/components/dashboard/DeadlineDashboardOverview'
import { createClient } from '@/lib/supabase/server'
import { sortNearest } from '@/lib/deadline-utils'
import { redirect } from 'next/navigation'
import type { AcademicDeadline, Profile } from '@/types'
import { getEffectivePlan } from '@/lib/plans'

type DashboardProfile = Pick<
  Profile,
  'full_name' | 'email' | 'plan' | 'pulse_trial_until' | 'plan_expires_at' | 'subscription_expires_at' | 'command_expires_at' | 'lifetime_command' | 'referral_code' | 'profile_completed' | 'telegram_chat_id' | 'nexa_id' | 'campus_name'
>

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { created?: string; updated?: string; deleted?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command, referral_code, profile_completed, telegram_chat_id, nexa_id, campus_name')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.profile_completed) {
    redirect('/onboarding')
  }

  const [{ data: deadlines, error }, referralStats] = await Promise.all([
    supabase
      .from('academic_deadlines')
      .select('*')
      .eq('user_id', user.id)
      .order('deadline_date', { ascending: true })
      .order('deadline_time', { ascending: true }),
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id),
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

  const dashboardProfile = profile as DashboardProfile | null

  return (
    <DeadlineDashboardOverview
      initialDeadlines={((deadlines ?? []) as AcademicDeadline[]).sort(sortNearest)}
      userName={dashboardProfile?.full_name}
      userTier={getEffectivePlan({ ...(dashboardProfile ?? {}), email: user.email })}
      referralCode={dashboardProfile?.referral_code}
      nexaId={dashboardProfile?.nexa_id ?? null}
      referralCount={referralStats.count ?? 0}
      profileCompleted={Boolean(dashboardProfile?.profile_completed)}
      hasTelegramChatId={Boolean(dashboardProfile?.telegram_chat_id)}
      defaultCampus={dashboardProfile?.campus_name || 'Kampus'}
      showCreatedMessage={searchParams?.created === 'deadline'}
      showUpdatedMessage={searchParams?.updated === 'deadline'}
      showDeletedMessage={searchParams?.deleted === 'deadline'}
    />
  )
}
