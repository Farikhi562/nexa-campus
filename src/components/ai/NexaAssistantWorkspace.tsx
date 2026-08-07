'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, BookOpen, Brain, ArrowRight } from 'lucide-react'
import NexaAssistantCommand from '@/components/ai/NexaAssistantCommand'
import MLRiskPanel from '@/components/ai/MLRiskPanel'
import StudyUploadForm from '@/components/study/StudyUploadForm'
import type { AcademicDeadline } from '@/types'

type RecentPack = {
  id: string
  topic: string
  source_filename: string | null
  created_at: string
}

type Tab = 'chat' | 'belajar' | 'risiko'

const TABS: Array<{ id: Tab; label: string; icon: typeof Bot }> = [
  { id: 'chat', label: 'Tanya NEXA', icon: Bot },
  { id: 'belajar', label: 'Belajar dari Materi', icon: BookOpen },
  { id: 'risiko', label: 'Analisa Risiko', icon: Brain },
]

export default function NexaAssistantWorkspace({
  deadlines,
  userName,
  campus,
  recentPacks,
}: {
  deadlines: AcademicDeadline[]
  userName?: string | null
  campus?: string | null
  recentPacks: RecentPack[]
}) {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <div>
      {/* Tab bar — pola yang sama dgn halaman Belajar dari Materi supaya konsisten */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-none items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-black transition sm:text-sm ${
                active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'chat' && <NexaAssistantCommand deadlines={deadlines} userName={userName} campus={campus} />}

      {tab === 'belajar' && (
        <div className="space-y-4">
          <StudyUploadForm />

          {recentPacks.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Materi Terakhir</p>
                <Link href="/dashboard/study" className="flex items-center gap-1 text-xs font-black text-violet-700 hover:text-violet-800">
                  Lihat semua <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-1.5">
                {recentPacks.map((pack) => (
                  <Link
                    key={pack.id}
                    href={`/dashboard/study/${pack.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition hover:bg-violet-50/60"
                  >
                    <span className="min-w-0 truncate font-bold text-slate-700">{pack.topic}</span>
                    <span className="flex-none text-[11px] text-slate-400">
                      {new Date(pack.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'risiko' && <MLRiskPanel />}
    </div>
  )
}
