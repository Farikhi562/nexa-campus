import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import DashboardSuccessToast from '@/components/DashboardSuccessToast'
import FirstTimeOnboarding from '@/components/FirstTimeOnboarding'
import PwaInstallBanner from '@/components/PwaInstallBanner'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'
import { Suspense, type ReactNode } from 'react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  const userName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    null

  return (
    <AppShell profile={profile as Pick<Profile, 'plan'> | null}>
      {children}
      <Suspense fallback={null}>
        <DashboardSuccessToast />
      </Suspense>
      <PwaInstallBanner />
      {!profile?.onboarding_completed && (
        <FirstTimeOnboarding userId={user.id} userName={userName} />
      )}
    </AppShell>
  )
}
