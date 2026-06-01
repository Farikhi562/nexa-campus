'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { DEADLINE_SOURCES, DEADLINE_TYPES, PRIORITIES } from '@/lib/nexa-data'
import type { AcademicDeadline, Profile } from '@/types'

export default function DeadlineForm({
  profile,
  deadline,
  activeCount,
}: {
  profile: Profile
  deadline?: AcademicDeadline
  activeCount: number
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isEditing = Boolean(deadline)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!isEditing && profile.plan === 'radar' && activeCount >= 5) {
      setError('Paket Radar maksimal 5 active deadlines. Upgrade dulu kalau deadline-mu sudah mulai ramai.')
      return
    }

    setLoading(true)
    const form = new FormData(event.currentTarget)
    const payload = {
      user_id: profile.id,
      title: String(form.get('title') || '').trim() || null,
      course_name: String(form.get('course_name') || '').trim(),
      type: String(form.get('type')),
      source: String(form.get('source')),
      deadline_date: String(form.get('deadline_date')),
      deadline_time: String(form.get('deadline_time')),
      campus: String(form.get('campus') || '').trim(),
      room: String(form.get('room') || '').trim(),
      location_note: String(form.get('location_note') || '').trim() || null,
      notes: String(form.get('notes') || '').trim() || null,
      status: String(form.get('status') || 'pending'),
      priority: String(form.get('priority') || 'normal'),
      reminder_enabled: form.get('reminder_enabled') === 'on',
    }

    const query = isEditing
      ? supabase.from('academic_deadlines').update(payload).eq('id', deadline!.id)
      : supabase.from('academic_deadlines').insert(payload)

    const { error: saveError } = await query
    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    router.push('/dashboard/deadlines')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Judul opsional</span>
          <input name="title" defaultValue={deadline?.title ?? ''} placeholder="Kosongkan untuk auto: Tugas Algoritma" className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Mata kuliah / kegiatan</span>
          <input name="course_name" defaultValue={deadline?.course_name ?? ''} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Tipe</span>
          <select name="type" defaultValue={deadline?.type ?? 'tugas'} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            {DEADLINE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Sumber</span>
          <select name="source" defaultValue={deadline?.source ?? 'vclass'} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            {DEADLINE_SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Prioritas</span>
          <select name="priority" defaultValue={deadline?.priority ?? 'normal'} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Tanggal</span>
          <input type="date" name="deadline_date" defaultValue={deadline?.deadline_date ?? ''} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Jam</span>
          <input type="time" name="deadline_time" defaultValue={deadline?.deadline_time?.slice(0, 5) ?? '23:59'} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Kampus</span>
          <input name="campus" defaultValue={deadline?.campus ?? profile.campus_name ?? ''} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Ruangan</span>
          <input name="room" defaultValue={deadline?.room ?? ''} required className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Catatan lokasi opsional</span>
          <input name="location_note" defaultValue={deadline?.location_note ?? ''} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Status</span>
          <select name="status" defaultValue={deadline?.status ?? 'pending'} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
          <input type="checkbox" name="reminder_enabled" defaultChecked={deadline?.reminder_enabled ?? false} />
          Aktifkan reminder
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-bold text-slate-700">Notes opsional</span>
          <textarea name="notes" defaultValue={deadline?.notes ?? ''} rows={4} className="focus-ring w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
        </label>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : isEditing ? 'Simpan Deadline' : 'Tambah Deadline'}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
      </div>
    </form>
  )
}
