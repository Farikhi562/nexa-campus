'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'

const CATEGORIES = [
  'umum',
  'informatika',
  'matematika',
  'fisika',
  'kimia',
  'biologi',
  'ekonomi',
  'hukum',
  'kedokteran',
  'bahasa',
  'seni',
  'lainnya',
]

export default function CreateRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    topic: '',
    category: 'umum',
    max_members: '8',
    visibility: 'public',
    scheduled_at: '',
  })

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function submit() {
    if (!form.title.trim()) {
      setError('Judul room wajib diisi.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/study-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        topic: form.topic.trim() || null,
        category: form.category,
        max_members: Number(form.max_members),
        visibility: form.visibility,
        scheduled_at: form.scheduled_at || null,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Gagal membuat room.')
      return
    }
    onCreated()
  }

  const inputCls =
    'focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400'
  const labelCls = 'mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600'

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-950">Buat Study Room</h2>
          <button
            onClick={onClose}
            className="focus-ring rounded-xl p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Judul Room *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Cth: Belajar Kalkulus UTS"
              className={inputCls}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Kategori</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Maks anggota</label>
              <input
                type="number"
                min="2"
                max="50"
                value={form.max_members}
                onChange={(e) => set('max_members', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Topik / hashtag</label>
            <input
              value={form.topic}
              onChange={(e) => set('topic', e.target.value)}
              placeholder="Cth: kalkulus-integral"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Deskripsi (opsional)</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Tujuan room, materi yang dibahas, dll."
              className={inputCls}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Jadwal (opsional)</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => set('scheduled_at', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Visibilitas</label>
              <select
                value={form.visibility}
                onChange={(e) => set('visibility', e.target.value)}
                className={inputCls}
              >
                <option value="public">Publik</option>
                <option value="private">Privat</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex gap-2">
          <Button onClick={submit} disabled={loading} className="flex-1 rounded-2xl">
            {loading ? 'Membuat...' : 'Buat Room'}
          </Button>
          <Button onClick={onClose} variant="outline" className="rounded-2xl">
            Batal
          </Button>
        </div>
      </div>
    </div>
  )
}
