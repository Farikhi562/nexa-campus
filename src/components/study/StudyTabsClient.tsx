'use client'

import { useState } from 'react'
import { BookOpen, Brain, ClipboardList, CreditCard, FileText } from 'lucide-react'
import StudyRoadmapView from './StudyRoadmapView'
import StudyQuizView from './StudyQuizView'
import FlashcardView from './FlashcardView'
import PracticeView from './PracticeView'
import SimpleMarkdown from './SimpleMarkdown'
import type { StudyRoadmapStep, StudyQuizQuestion } from '@/lib/study/types'

type Tab = 'roadmap' | 'summary' | 'flashcard' | 'quiz' | 'practice'

const TABS: Array<{ id: Tab; label: string; icon: typeof BookOpen }> = [
  { id: 'roadmap', label: 'Roadmap', icon: BookOpen },
  { id: 'summary', label: 'Rangkuman', icon: FileText },
  { id: 'flashcard', label: 'Flashcard', icon: CreditCard },
  { id: 'quiz', label: 'Quiz', icon: ClipboardList },
  { id: 'practice', label: 'Latihan', icon: Brain },
]

type Props = {
  packId: string
  roadmap: StudyRoadmapStep[]
  summary: string
  quiz: StudyQuizQuestion[]
  quizBestScore: number | null
}

export default function StudyTabsClient({ packId, roadmap, summary, quiz, quizBestScore }: Props) {
  const [tab, setTab] = useState<Tab>('roadmap')

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex overflow-x-auto gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-none items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition whitespace-nowrap ${
                active ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Panel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        {tab === 'roadmap' && <StudyRoadmapView roadmap={roadmap} packId={packId} />}
        {tab === 'summary' && <SimpleMarkdown text={summary} />}
        {tab === 'flashcard' && <FlashcardView packId={packId} />}
        {tab === 'quiz' && <StudyQuizView packId={packId} quiz={quiz} initialBestScore={quizBestScore} />}
        {tab === 'practice' && <PracticeView packId={packId} />}
      </div>
    </div>
  )
}
