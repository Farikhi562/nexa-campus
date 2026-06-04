import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/OnboardingForm'
import NexaLogo from '@/components/NexaLogo'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { ref?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.profile_completed) redirect('/dashboard')

  const fallbackProfile: Partial<Profile> = {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    plan: 'radar',
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <NexaLogo className="h-10 w-10" />
          <div>
            <p className="font-black">Setup profil</p>
            <p className="text-sm text-slate-500">Data minimum dulu, biar dashboard nyambung.</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Kenalan sebentar.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            NEXA butuh profil dasar untuk label kampus, reminder, dan batas paket. Password platform kampus tidak pernah diminta.
          </p>
          <div className="mt-6">
            <OnboardingForm
              profile={(profile as Partial<Profile>) ?? fallbackProfile}
              referralCode={searchParams?.ref}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
