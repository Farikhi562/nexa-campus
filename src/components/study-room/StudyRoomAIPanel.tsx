'use client'

import { useState } from 'react'
import { BookOpen, Brain, ClipboardList, Loader2, RotateCcw, SendHorizonal, Sparkles, X } from 'lucide-react'
import SimpleMarkdown from '@/components/study/SimpleMarkdown'

type Action = 'summarize' | 'ask' | 'plan'

const ACTION_META: Record<Action, { label: string; icon: typeof Brain; description: string }> = {
  summarize: { label: 'Rangkum Diskusi', icon: ClipboardList, description: 'Rangkum poin penting, follow-up, dan action items dari obrolan.' },
  ask: { label: 'Tanya AI', icon: Brain, description: 'Tanya apapun tentang materi atau topik belajar grup.' },
  plan: { label: 'Buat Rencana', icon: BookOpen, description: 'Generate rencana belajar mingguan berdasarkan target grup.' },
}

export default function StudyRoomAIPanel({ roomId }: { roomId: string }) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<Action>('summarize')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    if (action === 'ask' && !question.trim()) return
    setLoading(true)
    setResult('')
    setError('')
    try {
      const res = await fetch(`/api/study-rooms/${roomId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, question: question.trim() || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'AI sedang tidak tersedia.'); return }
      setResult(json.result ?? '')
    } catch { setError('Koneksi bermasalah. Coba lagi.') }
    finally { setLoading(false) }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Tutor
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-violet-100 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-xs font-black text-violet-700">AI Tutor Room</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-1 text-slate-400 hover:bg-violet-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tab pilih action */}
      <div className="flex gap-1 border-b border-violet-100 px-3 py-2">
        {(Object.entries(ACTION_META) as [Action, typeof ACTION_META[Action]][]).map(([key, meta]) => {
          const Icon = meta.icon
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setAction(key); setResult(''); setError('') }}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-black transition ${action === key ? 'bg-violet-600 text-white' : 'text-slate-500 hover:bg-violet-100'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </button>
          )
        })}
      </div>

      <div className="p-3 space-y-3">
        <p className="text-xs leading-5 text-slate-500">{ACTION_META[action].description}</p>

        {action === 'ask' && (
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void run() }}
              placeholder="Contoh: Apa itu pointer di C++? Jelasin metode SWOT..."
              className="focus-ring flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={run}
              disabled={loading || !question.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
            </button>
          </div>
        )}

        {action !== 'ask' && (
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-black text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'AI sedang berpikir...' : ACTION_META[action].label}
          </button>
        )}

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        {result && (
          <div className="space-y-2">
            <div className="rounded-2xl border border-violet-100 bg-white p-3">
              <SimpleMarkdown text={result} />
            </div>
            <button
              type="button"
              onClick={() => { setResult(''); setError('') }}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-violet-600"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
