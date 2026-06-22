'use client'

import { useState } from 'react'
import { BookOpenCheck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import SimpleMarkdown from './SimpleMarkdown'

type Props = {
  packId: string
  concept: string
  description: string
}

export default function ConceptExplainer({ packId, concept, description }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')

  async function explain() {
    if (explanation) { setOpen((o) => !o); return }
    setLoading(true)
    setError('')
    setOpen(true)
    try {
      const res = await fetch(`/api/study/packs/${packId}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, description }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error || 'Gagal memuat penjelasan.'); return }
      setExplanation(json.explanation ?? '')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={explain}
        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-100"
      >
        <BookOpenCheck className="h-3.5 w-3.5" />
        {explanation ? (open ? 'Sembunyikan' : 'Tampilkan') : 'Pelajari lebih dalam'}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-2 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-violet-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI sedang menjelaskan...
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {explanation && <SimpleMarkdown text={explanation} />}
        </div>
      )}
    </div>
  )
}
