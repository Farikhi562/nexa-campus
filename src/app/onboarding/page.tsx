import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/OnboardingForm'
import NexaCampusLogo from '@/components/NexaCampusLogo'
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
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-slate-950 to-slate-900" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.25),transparent_22rem)]" />

      <div className="relative mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <NexaCampusLogo size="sm" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-300">Setup profil</p>
            <p className="text-sm text-slate-300">Data minimum dulu, biar dashboard nyambung.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-slate-950/10 ring-1 ring-slate-950/5">
          <div className="border-b border-slate-100 bg-gradient-to-br from-white to-teal-50/60 p-6 sm:p-7">
            <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800">
              Langkah terakhir
            </span>
            <h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">Kenalan sebentar.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              NEXA butuh profil dasar untuk label kampus, reminder, dan batas paket. Password platform kampus tidak pernah diminta.
            </p>
          </div>
          <div className="p-5 sm:p-7">
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
