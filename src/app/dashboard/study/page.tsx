import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Lock, Plus, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'

export const metadata = {
  title: 'Belajar dari Materi — NEXA Campus',
}

export default async function StudyListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  const plan = getEffectivePlan({ ...(profile ?? {}), email: user.email })

  if (plan !== 'command') {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/50 p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-amber-950">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-950">Belajar dari Materi khusus NEXA Command</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Upload materi kuliah, NEXA susunkan roadmap belajar, rangkuman, dan quiz interaktif —
            tersedia untuk pengguna NEXA Command.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link
              href="/dashboard/billing"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-amber-950 transition hover:bg-amber-400"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade ke Command
            </Link>
            <Link
              href="/dashboard/nexa-assistant"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: packs } = await supabase
    .from('study_packs')
    .select('id, topic, source_filename, source_type, quiz_best_score, quiz_attempts, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const list = packs ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-950">Belajar dari Materi</h1>
            <p className="text-sm text-slate-500">Roadmap, rangkuman, dan quiz dari materi kuliahmu.</p>
          </div>
        </div>
        <Link
          href="/dashboard/study/new"
          className="inline-flex min-h-11 flex-none items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Materi Baru</span>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/30 p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-violet-400" />
          <p className="text-sm font-bold text-slate-700">Belum ada materi belajar.</p>
          <p className="mt-1 text-xs text-slate-500">Upload catatan atau transkrip kuliah pertamamu untuk mulai.</p>
          <Link
            href="/dashboard/study/new"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Buat Materi Pertama
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((pack) => (
            <Link
              key={pack.id}
              href={`/dashboard/study/${pack.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:shadow-sm"
            >
              <p className="truncate text-sm font-black text-slate-950">{pack.topic}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {pack.source_filename || (pack.source_type === 'text' ? 'Teks tempel' : 'Materi')}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {pack.quiz_best_score !== null && (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-black text-violet-700">
                    Skor terbaik: {pack.quiz_best_score}
                  </span>
                )}
                <span className="text-[11px] text-slate-400">
                  {new Date(pack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
