'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Circle, Loader2, Plus, Trash2 } from 'lucide-react'
import type { ChecklistItem } from '@/lib/study/types'

// ─── Helper ───────────────────────────────────────────────────────────────────

function genId() {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Item row ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: ChecklistItem
  onToggle: () => void
  onDelete: () => void
}

function ItemRow({ item, onToggle, onDelete }: ItemRowProps) {
  return (
    <div className={`group flex items-center gap-3 py-2.5 px-1 border-b border-zinc-800 last:border-0 transition-opacity ${item.done ? 'opacity-50' : ''}`}>
      <button onClick={onToggle} className="shrink-0 text-zinc-400 hover:text-teal-400 transition-colors">
        {item.done
          ? <CheckCircle2 size={18} className="text-teal-400" />
          : <Circle size={18} />
        }
      </button>
      <span className={`flex-1 text-sm leading-snug ${item.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
        {item.text}
      </span>
      <button
        onClick={onDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  packId: string
}

export function StudyChecklist({ packId }: Props) {
  const [items, setItems]     = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [newText, setNewText] = useState('')
  const saveTimer             = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  // ── Load from API ──
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/study/packs/${packId}/checklist`)
        if (res.ok) {
          const j = await res.json() as { items: ChecklistItem[] }
          setItems(j.items)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [packId])

  // ── Debounced save ──
  function scheduleSave(nextItems: ChecklistItem[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/study/packs/${packId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: nextItems }),
      }).catch(() => null)
      setSaving(false)
    }, 800)
  }

  function updateItems(next: ChecklistItem[]) {
    setItems(next)
    scheduleSave(next)
  }

  function toggleItem(id: string) {
    updateItems(items.map((it) => it.id === id ? { ...it, done: !it.done } : it))
  }

  function deleteItem(id: string) {
    const next = items.filter((it) => it.id !== id).map((it, i) => ({ ...it, order: i }))
    updateItems(next)
  }

  function addItem() {
    const text = newText.trim()
    if (!text) return
    const next: ChecklistItem = { id: genId(), text, done: false, order: items.length }
    updateItems([...items, next])
    setNewText('')
    inputRef.current?.focus()
  }

  const doneCount = items.filter((it) => it.done).length
  const pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 gap-2 text-zinc-500">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Memuat checklist…</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">Checklist Belajar</h3>
          <div className="flex items-center gap-2">
            {saving && <Loader2 size={11} className="animate-spin text-zinc-600" />}
            <span className="text-xs text-zinc-500">{doneCount}/{items.length}</span>
          </div>
        </div>
        {items.length > 0 && (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-zinc-600 text-right">{pct}% selesai</p>
          </div>
        )}
      </div>

      {/* All done banner */}
      {items.length > 0 && doneCount === items.length && (
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-700/50 px-4 py-2.5 text-sm text-emerald-300 text-center">
          🎉 Semua checklist selesai!
        </div>
      )}

      {/* Items */}
      {items.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-3">Belum ada item. Tambahkan di bawah.</p>
      )}
      <div className="rounded-2xl bg-zinc-800/40 border border-zinc-700/40 px-3 divide-y divide-zinc-800">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={() => toggleItem(item.id)}
            onDelete={() => deleteItem(item.id)}
          />
        ))}
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
          placeholder="Tambah item baru…"
          maxLength={200}
          className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 focus:border-teal-500 outline-none text-sm text-zinc-200 placeholder:text-zinc-600 px-3 py-2 transition-colors"
        />
        <button
          onClick={addItem}
          disabled={!newText.trim()}
          className="rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 px-3 py-2 text-white transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
