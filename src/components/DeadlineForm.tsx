'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { DEADLINE_SOURCES, DEADLINE_STATUSES, DEADLINE_TYPES, PRIORITIES } from '@/lib/nexa-data'
import type { AcademicDeadline, DeadlinePriority, DeadlineSource, DeadlineStatus, DeadlineType, Profile } from '@/types'

const typeValues = new Set(DEADLINE_TYPES.map((item) => item.value))
const sourceValues = new Set(DEADLINE_SOURCES.map((item) => item.value))
const priorityValues = new Set(PRIORITIES.map((item) => item.value))
const statusValues = new Set(DEADLINE_STATUSES.map((item) => item.value))

function todayValue() {
  return new Date().toISOString().slice(0, 10)
}

function text(form: FormData, key: string) {
  return String(form.get(key) || '').trim()
}

function optionalText(form: FormData, key: string) {
  const value = text(form, key)
  return value ? value : null
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function Field({
  children,
  helper,
  span = false,
}: {
  children: React.ReactNode
  helper?: string
  span?: boolean
}) {
  return (
    <div className={span ? 'md:col-span-2' : ''}>
      {children}
      {helper && <p className="mt-1.5 text-xs leading-5 text-slate-500">{helper}</p>}
    </div>
  )
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-black text-slate-950">{title}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isEditing = Boolean(deadline)

  function validate(payload: {
    course_name: string
    type: string
    source: string
    deadline_date: string
    deadline_time: string
    campus: string
    room: string
    priority: string
    status: string
  }) {
    if (!payload.course_name) return 'Mata kuliah atau kegiatan wajib diisi.'
    if (!typeValues.has(payload.type as DeadlineType)) return 'Tipe deadline tidak valid.'
    if (!sourceValues.has(payload.source as DeadlineSource)) return 'Sumber deadline tidak valid.'
    if (!isValidDate(payload.deadline_date)) return 'Tanggal deadline tidak valid.'
    if (!isValidTime(payload.deadline_time)) return 'Jam deadline tidak valid.'
    if (!payload.campus) return 'Kampus wajib diisi.'
    if (!payload.room) return 'Ruangan wajib diisi. Kalau online, isi dengan Online.'
    if (!priorityValues.has(payload.priority as DeadlinePriority)) return 'Prioritas tidak valid.'
    if (!statusValues.has(payload.status as DeadlineStatus)) return 'Status tidak valid.'
    return ''
  }

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
      title: optionalText(form, 'title'),
      course_name: text(form, 'course_name'),
      type: text(form, 'type'),
      source: text(form, 'source'),
      deadline_date: text(form, 'deadline_date'),
      deadline_time: text(form, 'deadline_time'),
      campus: text(form, 'campus'),
      room: text(form, 'room'),
      location_note: optionalText(form, 'location_note'),
      notes: optionalText(form, 'notes'),
      status: text(form, 'status') || 'pending',
      priority: text(form, 'priority') || 'normal',
      reminder_enabled: form.get('reminder_enabled') === 'on',
    }

    const validationError = validate(payload)
    if (validationError) {
      setError(validationError)
      setLoading(false)
      return
    }

    if (!isEditing) {
      const response = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => null)) as { error?: string } | null
      setLoading(false)

      if (!response.ok) {
        setError(result?.error || 'Deadline gagal disimpan. Coba lagi sebentar.')
        return
      }

      router.push('/dashboard?created=deadline')
      router.refresh()
      return
    }

    const response = await fetch(`/api/deadlines/${deadline!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = (await response.json().catch(() => null)) as { error?: string } | null
    setLoading(false)

    if (!response.ok) {
      setError(result?.error || 'Deadline gagal diupdate. Coba lagi sebentar.')
      return
    }

    router.push('/dashboard?updated=deadline')
    router.refresh()
  }

  async function deleteDeadline() {
    if (!deadline) return
    if (!confirm('Yakin mau hapus deadline ini? Kalau sudah dihapus, NEXA nggak bisa nyelametin dia lagi.')) return

    setDeleting(true)
    setError('')

    const response = await fetch(`/api/deadlines/${deadline.id}`, {
      method: 'DELETE',
    })
    const result = (await response.json().catch(() => null)) as { error?: string } | null

    setDeleting(false)

    if (!response.ok) {
      setError(result?.error || 'Deadline gagal dihapus. Coba lagi sebentar.')
      return
    }

    router.push('/dashboard?deleted=deadline')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4 pb-24 sm:pb-0">
      <Section eyebrow="01" title="Info deadline">
        <Field span helper="Opsional. Kalau kosong, NEXA akan tampilkan otomatis seperti Tugas Algoritma.">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Judul</span>
            <input name="title" defaultValue={deadline?.title ?? ''} placeholder="Contoh: Laporan bab 3" className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
        <Field>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Mata kuliah / kegiatan</span>
            <input name="course_name" defaultValue={deadline?.course_name ?? ''} placeholder="Algoritma, AOA, BAAK..." required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
        <Field>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Tipe</span>
            <select name="type" defaultValue={deadline?.type ?? 'tugas'} required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              {DEADLINE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </Field>
        <Field span helper="Masukin sumber deadline biar nanti gampang dicek ulang.">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Sumber</span>
            <select name="source" defaultValue={deadline?.source ?? 'vclass'} required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              {DEADLINE_SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </Field>
      </Section>

      <Section eyebrow="02" title="Waktu deadline">
        <Field>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Tanggal</span>
            <input type="date" name="deadline_date" defaultValue={deadline?.deadline_date ?? todayValue()} required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
        <Field>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Jam</span>
            <input type="time" name="deadline_time" defaultValue={deadline?.deadline_time?.slice(0, 5) ?? '23:59'} required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
      </Section>

      <Section eyebrow="03" title="Lokasi">
        <Field helper="Kalau online, isi ruangan dengan Online. Simpel aja.">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Kampus</span>
            <input name="campus" defaultValue={deadline?.campus ?? profile.campus_name ?? ''} placeholder="Kampus D, Kampus E, Online..." required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
        <Field>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Ruangan</span>
            <input name="room" defaultValue={deadline?.room ?? ''} placeholder="D441, Lab, Online" required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
        <Field span>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Catatan lokasi opsional</span>
            <input name="location_note" defaultValue={deadline?.location_note ?? ''} placeholder="Link meet, lantai, atau instruksi kecil lainnya" className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
      </Section>

      <Section eyebrow="04" title="Detail tambahan">
        <Field>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Prioritas</span>
            <select name="priority" defaultValue={deadline?.priority ?? 'normal'} required className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </Field>
        <Field>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Status</span>
            <select name="status" defaultValue={deadline?.status ?? 'pending'} className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
              {DEADLINE_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </Field>
        <Field span helper="NEXA cuma nyimpen deadline yang kamu input. Password kampus? Nggak usah, hidup udah cukup ribet.">
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
            <input type="checkbox" name="reminder_enabled" defaultChecked={deadline?.reminder_enabled ?? false} className="mt-0.5" />
            <span>
              Tandai butuh reminder
              <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">Ini baru status di deadline. Integrasi bot tidak dikerjakan di fitur ini.</span>
            </span>
          </label>
        </Field>
        <Field span>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-slate-700">Notes opsional</span>
            <textarea name="notes" defaultValue={deadline?.notes ?? ''} rows={4} placeholder="Instruksi dosen, format file, link sumber, atau catatan kecil lainnya" className="focus-ring w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
          </label>
        </Field>
      </Section>

      {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <div className="mx-auto flex max-w-3xl gap-3 sm:mx-0">
          <Button type="submit" disabled={loading} className="min-h-12 flex-1 rounded-2xl">
            {loading ? 'Menyimpan...' : isEditing ? 'Simpan Deadline' : 'Tambah Deadline'}
          </Button>
          <Button type="button" variant="outline" className="min-h-12 rounded-2xl" onClick={() => router.back()} disabled={loading}>
            Batal
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="danger"
              className="hidden min-h-12 rounded-2xl sm:inline-flex"
              onClick={deleteDeadline}
              disabled={loading || deleting}
            >
              {deleting ? 'Hapus...' : 'Hapus'}
            </Button>
          )}
        </div>
        {isEditing && (
          <Button
            type="button"
            variant="danger"
            className="mt-2 min-h-12 w-full rounded-2xl sm:hidden"
            onClick={deleteDeadline}
            disabled={loading || deleting}
          >
            {deleting ? 'Menghapus...' : 'Hapus Deadline'}
          </Button>
        )}
      </div>
    </form>
  )
}
