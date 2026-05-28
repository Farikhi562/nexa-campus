'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Bell,
  BookOpenCheck,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FlaskConical,
  GraduationCap,
  Layers3,
  Lock,
  MessageCircle,
  Mic2,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { PlanBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Schedule } from '@/types'

type ReminderType = 'ujian' | 'tugas' | 'praktikum' | 'kuis' | 'presentasi' | 'organisasi' | 'lainnya'
type Priority = 'normal' | 'penting' | 'urgent'

const REMINDER_TYPES: Array<{ id: ReminderType; label: string; icon: typeof GraduationCap; color: string }> = [
  { id: 'ujian', label: 'Ujian', icon: GraduationCap, color: 'bg-brand-50 text-brand-700 border-brand-100' },
  { id: 'tugas', label: 'Tugas', icon: ClipboardList, color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { id: 'praktikum', label: 'Praktikum', icon: FlaskConical, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { id: 'kuis', label: 'Kuis', icon: BookOpenCheck, color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  { id: 'presentasi', label: 'Presentasi', icon: Mic2, color: 'bg-rose-50 text-rose-700 border-rose-100' },
  { id: 'organisasi', label: 'Organisasi', icon: Users, color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { id: 'lainnya', label: 'Lainnya', icon: Layers3, color: 'bg-slate-100 text-slate-700 border-slate-200' },
]

const REMINDER_PRESETS = [
  'H-7 pagi',
  'H-3 malam',
  'H-1 pagi',
  '3 jam sebelum',
  '30 menit sebelum',
]

const SAMPLE_AI_SUGGESTIONS = [
  'Tugas Metodologi Riset biasanya butuh reminder H-7 untuk mulai outline.',
  'Praktikum pagi sebaiknya diingatkan malam sebelumnya untuk cek jas lab dan modul.',
  'Presentasi kelompok perlu reminder H-3 untuk finalisasi slide dan pembagian bicara.',
]

function parseReminderTitle(subjectName: string) {
  const match = subjectName.match(/^\[(.+?)\]\s(.+)$/)
  if (!match) return { type: 'ujian' as ReminderType, title: subjectName }

  const rawType = match[1].toLowerCase() as ReminderType
  const exists = REMINDER_TYPES.some((item) => item.id === rawType)
  return {
    type: exists ? rawType : 'lainnya',
    title: match[2],
  }
}

function getDaysLeft(date: string) {
  const target = new Date(date)
  target.setHours(23, 59, 59, 999)
  return Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function JadwalPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myDocs, setMyDocs] = useState<{ id: string; title: string }[]>([])

  const [form, setForm] = useState({
    type: 'tugas' as ReminderType,
    title: '',
    course: '',
    due_date: '',
    due_time: '',
    priority: 'normal' as Priority,
    whatsapp_number: '',
    document_id: '',
  })

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, schedulesRes, docsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('schedules').select('*').eq('user_id', user.id).order('exam_date'),
      supabase.from('documents').select('id, title').eq('user_id', user.id).eq('status', 'completed'),
    ])

    setProfile(profileRes.data as Profile)
    setSchedules((schedulesRes.data ?? []) as Schedule[])
    setMyDocs(docsRes.data ?? [])

    if (profileRes.data?.whatsapp_number) {
      setForm((current) => ({ ...current, whatsapp_number: profileRes.data!.whatsapp_number! }))
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const isPro = profile?.plan === 'pro'
  const parsedSchedules = useMemo(() => {
    return schedules.map((schedule) => ({
      ...schedule,
      ...parseReminderTitle(schedule.subject_name),
      daysLeft: getDaysLeft(schedule.exam_date),
    }))
  }, [schedules])

  const urgentCount = parsedSchedules.filter((item) => item.daysLeft <= 1).length
  const weekCount = parsedSchedules.filter((item) => item.daysLeft >= 0 && item.daysLeft <= 7).length
  const typeConfig = REMINDER_TYPES.find((item) => item.id === form.type) ?? REMINDER_TYPES[0]
  const TypeIcon = typeConfig.icon

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.due_date) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const coursePrefix = form.course.trim() ? `${form.course.trim()} - ` : ''
    const prioritySuffix = form.priority !== 'normal' ? ` (${form.priority})` : ''

    await supabase.from('schedules').insert({
      user_id: user!.id,
      subject_name: `[${form.type}] ${coursePrefix}${form.title.trim()}${prioritySuffix}`,
      exam_date: form.due_date,
      exam_time: form.due_time || null,
      whatsapp_number: isPro ? form.whatsapp_number || null : null,
      document_id: form.document_id || null,
    })

    setForm((current) => ({
      ...current,
      title: '',
      course: '',
      due_date: '',
      due_time: '',
      priority: 'normal',
      document_id: '',
    }))
    setSaving(false)
    fetchData()
  }

  async function handleDelete(id: string) {
    await supabase.from('schedules').delete().eq('id', id)
    setSchedules((current) => current.filter((schedule) => schedule.id !== id))
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-slate-500">Memuat reminder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Reminder Hub
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Reminder canggih untuk semua agenda kuliah.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Atur pengingat untuk tugas, praktikum, kuis, presentasi, ujian, agenda organisasi, dan deadline lain. NEXA menyiapkan pola reminder yang cocok dengan ritme mahasiswa.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: 'Reminder aktif', value: schedules.length, icon: Bell },
              { label: 'Minggu ini', value: weekCount, icon: Calendar },
              { label: 'Butuh aksi cepat', value: urgentCount, icon: AlertTriangle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-700 shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Tambah reminder</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih tipe agenda, tanggal, prioritas, dan channel pengingat.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Paket</span>
              <PlanBadge plan={profile?.plan ?? 'free'} />
            </div>
          </div>

          {!isPro && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="text-sm font-black text-amber-950">Reminder dasar aktif untuk semua paket</h3>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Kamu tetap bisa menyimpan agenda kuliah di NEXA. WhatsApp reminder otomatis dan sinkronisasi lanjutan dibuka di paket Pro.
                  </p>
                  <Link href="/pricing" className="mt-3 inline-flex">
                    <Button size="sm" type="button" className="bg-amber-500 hover:bg-amber-600">
                      Upgrade ke Pro
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Tipe agenda</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {REMINDER_TYPES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, type: id }))}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                      form.type === id ? color : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Judul agenda</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                  placeholder={form.type === 'praktikum' ? 'Praktikum titrasi asam basa' : form.type === 'tugas' ? 'Essay hukum bisnis' : 'Agenda kuliah'}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Mata kuliah / kegiatan</label>
                <input
                  type="text"
                  value={form.course}
                  onChange={(e) => setForm((current) => ({ ...current, course: e.target.value }))}
                  placeholder="Kimia Dasar, Statistika, BEM..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Tanggal deadline</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((current) => ({ ...current, due_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Jam</label>
                <input
                  type="time"
                  value={form.due_time}
                  onChange={(e) => setForm((current) => ({ ...current, due_time: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Prioritas</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((current) => ({ ...current, priority: e.target.value as Priority }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="normal">Normal</option>
                  <option value="penting">Penting</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nomor WhatsApp {isPro ? '' : '(Pro)'}
                </label>
                <input
                  type="tel"
                  value={form.whatsapp_number}
                  onChange={(e) => setForm((current) => ({ ...current, whatsapp_number: e.target.value }))}
                  placeholder="08123456789"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  disabled={!isPro}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Materi terkait</label>
                <select
                  value={form.document_id}
                  onChange={(e) => setForm((current) => ({ ...current, document_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Tidak ada materi terkait</option>
                  {myDocs.map((doc) => <option key={doc.id} value={doc.id}>{doc.title}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
                <Bell className="h-4 w-4 text-brand-600" />
                Pola reminder otomatis
              </p>
              <div className="flex flex-wrap gap-2">
                {REMINDER_PRESETS.map((preset) => (
                  <span key={preset} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600">
                    {preset}
                  </span>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              loading={saving}
              disabled={!form.title || !form.due_date || saving}
            >
              <MessageCircle className="h-4 w-4" />
              Simpan Reminder
            </Button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className={`mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${typeConfig.color}`}>
              <TypeIcon className="h-4 w-4" />
              {typeConfig.label}
            </div>
            <h2 className="text-lg font-black text-slate-950">AI reminder insight</h2>
            <div className="mt-4 space-y-3">
              {SAMPLE_AI_SUGGESTIONS.map((suggestion) => (
                <div key={suggestion} className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-black text-slate-950">Coverage reminder</h2>
            <div className="space-y-3">
              {REMINDER_TYPES.slice(0, 6).map(({ id, label, icon: Icon, color }) => {
                const count = parsedSchedules.filter((schedule) => schedule.type === id).length
                return (
                  <div key={id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-950">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Timeline aktif</h2>
            <p className="mt-1 text-sm text-slate-500">Agenda terdekat tampil paling atas.</p>
          </div>
          <Clock className="h-5 w-5 text-slate-400" />
        </div>

        {parsedSchedules.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Belum ada reminder aktif</p>
            <p className="mt-1 text-xs text-slate-400">Tambah tugas, praktikum, atau agenda kuliah pertama kamu.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {parsedSchedules.map((schedule) => {
              const config = REMINDER_TYPES.find((item) => item.id === schedule.type) ?? REMINDER_TYPES[0]
              const Icon = config.icon
              const isUrgent = schedule.daysLeft <= 1

              return (
                <article key={schedule.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize text-slate-600">
                          {config.label}
                        </span>
                        {isUrgent && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                            Prioritas cepat
                          </span>
                        )}
                      </div>
                      <h3 className="truncate text-sm font-black text-slate-950 sm:text-base">{schedule.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(schedule.exam_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {schedule.exam_time && ` - ${schedule.exam_time}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:w-64">
                      <div className="rounded-lg bg-slate-50 px-4 py-2 text-center">
                        <p className={`text-xl font-black ${isUrgent ? 'text-red-600' : 'text-brand-700'}`}>
                          {schedule.daysLeft > 0 ? schedule.daysLeft : 0}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">hari lagi</p>
                      </div>
                      <div className="hidden text-xs text-slate-500 sm:block">
                        <p>WA: {schedule.whatsapp_number}</p>
                        <p className="mt-1">
                          H-3 {schedule.reminder_sent_h3 ? 'sent' : 'ready'} | H-1 {schedule.reminder_sent_h1 ? 'sent' : 'ready'} | H-0 {schedule.reminder_sent_h0 ? 'sent' : 'ready'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Hapus reminder"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
