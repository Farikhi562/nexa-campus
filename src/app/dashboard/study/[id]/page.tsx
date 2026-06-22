import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import StudyRoadmapView from '@/components/study/StudyRoadmapView'
import StudyQuizView from '@/components/study/StudyQuizView'
import FlashcardView from '@/components/study/FlashcardView'
import PracticeView from '@/components/study/PracticeView'
import SimpleMarkdown from '@/components/study/SimpleMarkdown'
import StudyTabsClient from '@/components/study/StudyTabsClient'
import type { StudyRoadmapStep, StudyQuizQuestion } from '@/lib/study/types'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export default async function StudyDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id).maybeSingle()

  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) !== 'command') redirect('/dashboard/study')

  const { data: pack } = await supabase
    .from('study_packs').select('*')
    .eq('id', id).eq('user_id', user.id).maybeSingle()

  if (!pack) notFound()

  const roadmap = (Array.isArray(pack.roadmap) ? pack.roadmap : []) as StudyRoadmapStep[]
  const quiz = (Array.isArray(pack.quiz) ? pack.quiz : []) as StudyQuizQuestion[]

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard/study" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Semua Materi
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950 sm:text-2xl">{pack.topic}</h1>
            <p className="text-xs text-slate-400">
              {pack.source_filename || 'Materi tempel'} ·{' '}
              {new Date(pack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <StudyTabsClient
        packId={pack.id}
        roadmap={roadmap}
        summary={pack.summary || ''}
        quiz={quiz}
        quizBestScore={pack.quiz_best_score}
      />
    </div>
  )
}
