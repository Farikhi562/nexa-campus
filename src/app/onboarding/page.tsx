import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/OnboardingForm'
import NexaCampusLogo from '@/components/brand/NexaCampusLogo'
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
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.22),transparent_24rem),radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.12),transparent_22rem)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />

      <div className="relative mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <NexaCampusLogo tone="dark" imageClassName="h-11 w-11" />
          <div className="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
            Setup beta
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/30">
          <div className="border-b border-slate-100 bg-slate-50 p-5 sm:p-6">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Langkah terakhir</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Kenalan sebentar.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              NEXA butuh profil dasar untuk label kampus, reminder, dan batas paket. Password platform kampus tidak pernah diminta.
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <OnboardingForm
              profile={(profile as Partial<Profile>) ?? fallbackProfile}
              referralCode={searchParams?.ref}
            />
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus.
        </p>
      </div>
    </main>
  )
}
