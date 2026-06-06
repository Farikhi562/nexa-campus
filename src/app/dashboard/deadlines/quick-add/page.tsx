import Link from 'next/link'
import { redirect } from 'next/navigation'
import AIQuickAddDeadline from '@/components/ai/AIQuickAddDeadline'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export default async function AIQuickAddPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, campus_name')
    .eq('id', user.id)
    .maybeSingle()

  const typedProfile = profile as Pick<Profile, 'plan' | 'campus_name'> | null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-700">AI Quick Add</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">
            Extract deadline dari teks mentah.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Paste info dari grup WA, VClass, email, atau catatan dosen. NEXA bikin draft, kamu cek,
            lalu simpan.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          Kembali ke Dashboard
        </Link>
      </div>

      <AIQuickAddDeadline
        plan={typedProfile?.plan ?? 'radar'}
        campusName={typedProfile?.campus_name}
      />
    </div>
  )
}
