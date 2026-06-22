'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw, Sparkles, X, Zap } from 'lucide-react'
import type { Flashcard, FlashcardBoxes } from '@/lib/study/types'

type Props = { packId: string }

/** Interval penyimpanan progress ke server (debounce, bukan tiap flip) */
const SAVE_DEBOUNCE_MS = 2000

export default function FlashcardView({ packId }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [boxes, setBoxes] = useState<FlashcardBoxes>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/study/packs/${packId}/flashcards`, { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      setCards(json.flashcards ?? [])
      setBoxes(json.boxes ?? {})
    }
    setLoading(false)
  }, [packId])

  useEffect(() => { void load() }, [load])

  // Auto-save progress saat boxes berubah (debounced)
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(async () => {
      await fetch(`/api/study/packs/${packId}/flashcards`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxes }),
      })
      setDirty(false)
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [boxes, dirty, packId])

  async function generate() {
    setGenerating(true)
    setError('')
    const res = await fetch(`/api/study/packs/${packId}/flashcards`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) { setError(json.error || 'Gagal generate flashcard.'); setGenerating(false); return }
    setCards(json.flashcards ?? [])
    setCurrentIdx(0)
    setFlipped(false)
    setGenerating(false)
  }

  function setBox(box: 1 | 2 | 3) {
    const key = String(currentIdx)
    setBoxes((prev) => ({ ...prev, [key]: box }))
    setDirty(true)
    setFlipped(false)
    // Advance to next card
    setCurrentIdx((prev) => (prev + 1) % cards.length)
  }

  // Sesi: prioritaskan box 1 → box 2 → box 3
  const sessionOrder = useMemo(() => {
    const b1 = cards.map((_, i) => i).filter((i) => !boxes[i] || boxes[i] === 1)
    const b2 = cards.map((_, i) => i).filter((i) => boxes[i] === 2)
    const b3 = cards.map((_, i) => i).filter((i) => boxes[i] === 3)
    return [...b1, ...b2, ...b3]
  }, [cards, boxes])

  const totalKnown = cards.filter((_, i) => boxes[i] === 3).length
  const progress = cards.length > 0 ? totalKnown / cards.length : 0

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-violet-400" /></div>

  if (cards.length === 0) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-slate-500">Belum ada flashcard. Generate dari materi yang ada?</p>
        <button onClick={generate} disabled={generating}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Generating...' : 'Generate Flashcard'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  const card = cards[sessionOrder[currentIdx % sessionOrder.length] ?? currentIdx]

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">{totalKnown}/{cards.length} dikuasai</p>
          <button onClick={generate} disabled={generating} className="text-xs font-bold text-violet-600 hover:underline">
            {generating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex gap-1.5 text-[11px] text-slate-400">
          <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-600">Box 1: {cards.filter((_, i) => !boxes[i] || boxes[i] === 1).length}</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-600">Box 2: {cards.filter((_, i) => boxes[i] === 2).length}</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-600">Box 3: {totalKnown}</span>
        </div>
      </div>

      {/* Flip card */}
      <div
        className="relative mx-auto h-56 max-w-lg cursor-pointer select-none sm:h-64"
        onClick={() => setFlipped((f) => !f)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative h-full w-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}>
            <p className="text-xs font-black uppercase tracking-wide text-violet-400 mb-3">Pertanyaan</p>
            <p className="text-center text-lg font-black leading-snug text-slate-950">{card.front}</p>
            <p className="mt-4 text-xs text-slate-400">Tap untuk lihat jawaban</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-500 mb-3">Jawaban</p>
            <p className="text-center text-sm leading-6 text-slate-800">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Leitner buttons — hanya tampil setelah di-flip */}
      {flipped ? (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setBox(1)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-red-200 bg-red-50 py-3 text-xs font-black text-red-700 hover:bg-red-100">
            <X className="h-5 w-5" /> Belum tahu
          </button>
          <button onClick={() => setBox(2)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 py-3 text-xs font-black text-amber-700 hover:bg-amber-100">
            <Zap className="h-5 w-5" /> Agak tahu
          </button>
          <button onClick={() => setBox(3)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-100">
            <Check className="h-5 w-5" /> Sudah tahu
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setFlipped(false) }}
            className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-xs text-slate-400">{(currentIdx % cards.length) + 1} / {cards.length}</p>
          <button onClick={() => { setCurrentIdx((i) => (i + 1) % cards.length); setFlipped(false) }}
            className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  )
}
