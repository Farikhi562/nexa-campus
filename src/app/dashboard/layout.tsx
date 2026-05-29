import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/DashboardNav'
import PoweredByFooter from '@/components/PoweredByFooter'
import type { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile yet (race condition on first login), still render children
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardNav profile={profile as Profile} />

      {/*
        Mobile: pt-16 to clear top nav bar
        Desktop: pl-64 to clear sidebar, no top padding needed
      */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:py-8 lg:pb-8">
          {children}
        </div>
        <PoweredByFooter className="lg:mx-0" />
      </main>
    </div>
  )
}
