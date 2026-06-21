import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import StudyUploadForm from '@/components/study/StudyUploadForm'

export const metadata = {
  title: 'Materi Baru — NEXA Campus',
}

export default async function NewStudyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) !== 'command') {
    redirect('/dashboard/study')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/dashboard/study" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </Link>
      <StudyUploadForm />
    </div>
  )
}
