'use client'

import { useState } from 'react'
import { BrainCircuit, ChevronDown, ChevronUp, Loader2, RefreshCw, Send } from 'lucide-react'
import type { FeynmanFeedback, FeynmanSession } from '@/lib/study/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  packId: string
  topic: string
  /** Judul-judul dari roadmap untuk autocomplete / pilihan konsep */
  roadmapTopics?: string[]
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score < 0)  return { text: 'text-zinc-400',  ring: 'stroke-zinc-400',  label: '—' }
  if (score >= 75) return { text: 'text-emerald-400', ring: 'stroke-emerald-400', label: 'Paham' }
  if (score >= 50) return { text: 'text-amber-400',  ring: 'stroke-amber-400',  label: 'Cukup' }
  return           { text: 'text-rose-400',   ring: 'stroke-rose-400',   label: 'Perlu ulang' }
}

function ScoreRing({ score }: { score: number }) {
  const c = scoreColor(score)
  const r = 28
  const circ = 2 * Math.PI * r
  const pct  = score < 0 ? 0 : Math.min(score, 100)
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-800" />
        <circle
          cx="36" cy="36" r={r} fill="none" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          className={c.ring} style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className={`text-xl font-bold -mt-[52px] mb-[28px] ${c.text}`}>
        {score < 0 ? '–' : score}
      </span>
      <span className={`text-xs font-medium mt-1 ${c.text}`}>{c.label}</span>
    </div>
  )
}

// ─── Tag chips ────────────────────────────────────────────────────────────────

const chipStyle = {
  right: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
  gaps:  'bg-amber-900/50  text-amber-300  border border-amber-700/50',
  wrong: 'bg-rose-900/50   text-rose-300   border border-rose-700/50',
}

function TagSection({ label, items, variant }: { label: string; items: string[]; variant: keyof typeof chipStyle }) {
  if (items.length === 0) return null
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <span key={i} className={`inline-block rounded-lg px-3 py-1.5 text-sm ${chipStyle[variant]}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── History item ─────────────────────────────────────────────────────────────

function HistoryItem({ session }: { session: FeynmanSession }) {
  const [open, setOpen] = useState(false)
  const c = scoreColor(session.score)
  const date = new Date(session.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${c.text}`}>{session.score < 0 ? '–' : session.score}</span>
          <span className="text-sm text-zinc-300 truncate max-w-[200px]">{session.concept}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="text-xs">{date}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {open && (
        <div className="border-t border-zinc-700/50 px-4 py-3 space-y-2">
          <p className="text-xs text-zinc-400 italic">&ldquo;{session.user_explanation.slice(0, 200)}{session.user_explanation.length > 200 ? '…' : ''}&rdquo;</p>
          {session.feedback.tip && (
            <p className="text-xs text-teal-300">💡 {session.feedback.tip}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FeynmanBox({ packId, topic, roadmapTopics = [] }: Props) {
  const [concept, setConcept]         = useState('')
  const [customConcept, setCustom]    = useState('')
  const [useCustom, setUseCustom]     = useState(false)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [feedback, setFeedback]       = useState<FeynmanFeedback | null>(null)
  const [history, setHistory]         = useState<FeynmanSession[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const activeConcept = useCustom ? customConcept.trim() : concept

  async function loadHistory() {
    if (historyLoaded) return
    const res = await fetch(`/api/study/feynman?pack_id=${packId}`)
    if (res.ok) {
      const j = await res.json() as { data: FeynmanSession[] }
      setHistory(j.data)
    }
    setHistoryLoaded(true)
  }

  async function toggleHistory() {
    if (!showHistory) await loadHistory()
    setShowHistory(v => !v)
  }

  async function handleSubmit() {
    if (!activeConcept) { setError('Pilih atau ketik konsep yang mau dijelaskan.'); return }
    if (explanation.trim().length < 10) { setError('Tulis penjelasanmu dulu (minimal 10 karakter).'); return }

    setLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const res = await fetch('/api/study/feynman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: packId, concept: activeConcept, explanation, topic_context: topic }),
      })
      const data = await res.json() as { feedback?: FeynmanFeedback; error?: string; session_id?: string }
      if (!res.ok || !data.feedback) {
        setError(data.error ?? 'Terjadi kesalahan.')
        return
      }
      setFeedback(data.feedback)
      setHistoryLoaded(false) // refresh history next open
    } catch {
      setError('Gagal terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setFeedback(null)
    setExplanation('')
    setError(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BrainCircuit size={20} className="text-teal-400" />
        <h3 className="text-base font-semibold text-zinc-100">Mode Feynman</h3>
        <span className="ml-auto text-xs text-zinc-500">Jelaskan konsep = buktikan kamu paham</span>
      </div>

      {/* Concept picker */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-400 font-medium">Pilih konsep yang mau dijelaskan:</p>
        {roadmapTopics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {roadmapTopics.slice(0, 8).map((t) => (
              <button
                key={t}
                onClick={() => { setConcept(t); setUseCustom(false) }}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors border ${
                  !useCustom && concept === t
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-teal-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={customConcept}
            onFocus={() => setUseCustom(true)}
            onChange={(e) => { setCustom(e.target.value); setUseCustom(true) }}
            placeholder="Atau ketik konsep sendiri…"
            className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-teal-500 outline-none text-sm text-zinc-200 placeholder:text-zinc-600 px-3 py-2 transition-colors"
          />
        </div>
      </div>

      {/* Explanation textarea */}
      {!feedback && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400 font-medium">
            Jelaskan <span className="text-teal-400">{activeConcept || '—'}</span> seolah-olah kamu ngajarin teman:
          </p>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Contoh: 'OOP itu cara nulis kode di mana kita bikin objek yang punya sifat dan kemampuan sendiri…'"
            rows={5}
            maxLength={4000}
            className="w-full rounded-xl bg-zinc-800 border border-zinc-700 focus:border-teal-500 outline-none text-sm text-zinc-200 placeholder:text-zinc-600 px-3 py-2.5 resize-none transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">{explanation.length}/4000</span>
            {error && <p className="text-xs text-rose-400">{error}</p>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !activeConcept || explanation.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {loading ? 'Mengevaluasi…' : 'Evaluasi Penjelasanku'}
          </button>
        </div>
      )}

      {/* Feedback result */}
      {feedback && (
        <div className="rounded-2xl bg-zinc-800/60 border border-zinc-700/60 p-4 space-y-4">
          <div className="flex items-start gap-4">
            <ScoreRing score={feedback.score} />
            <div className="flex-1 space-y-3">
              <TagSection label="✅ Yang sudah kamu pahami" items={feedback.right} variant="right" />
              <TagSection label="⚠️ Poin yang terlewat" items={feedback.gaps} variant="gaps" />
              <TagSection label="❌ Yang perlu dikoreksi" items={feedback.wrong} variant="wrong" />
            </div>
          </div>
          {feedback.tip && (
            <div className="rounded-xl bg-teal-900/30 border border-teal-700/40 px-4 py-3">
              <p className="text-xs font-semibold text-teal-300 mb-1">💡 Saran berikutnya</p>
              <p className="text-sm text-teal-100">{feedback.tip}</p>
            </div>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RefreshCw size={12} /> Coba lagi dengan konsep lain
          </button>
        </div>
      )}

      {/* History toggle */}
      <button
        onClick={toggleHistory}
        className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1 flex items-center justify-center gap-1"
      >
        {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showHistory ? 'Sembunyikan riwayat' : 'Lihat riwayat evaluasi'}
      </button>

      {showHistory && (
        <div className="space-y-2">
          {history.length === 0
            ? <p className="text-xs text-zinc-500 text-center py-2">Belum ada riwayat.</p>
            : history.map((s) => <HistoryItem key={s.id} session={s} />)
          }
        </div>
      )}
    </div>
  )
}
