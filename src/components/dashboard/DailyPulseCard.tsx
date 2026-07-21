'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, CheckCircle2, Flame, Loader2, MoonStar, Sparkles, Target, Trophy, XCircle } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

type DailyMood = 'semangat' | 'normal' | 'capek' | 'tertekan'

type RecentDay = {
  activityDate: string
  mood: DailyMood | null
  checkoutMood: DailyMood | null
  goalCompleted: boolean | null
  checkedOut: boolean
}

type DailyPulse = {
  checkedIn: boolean
  checkedOut: boolean
  activityDate: string
  mood: DailyMood | null
  focusGoal: string | null
  checkinNote: string | null
  checkoutMood: DailyMood | null
  checkoutNote: string | null
  goalCompleted: boolean | null
  checkedOutAt: string | null
  pointsAwarded: number
  currentStreak: number
  totalCheckins: number
  completedToday: number
  pendingToday: number
  pointsToday: number
  recentDays: RecentDay[]
}

type DailyPulseResponse = { data?: DailyPulse; error?: string }

const moodOptions: Array<{ value: DailyMood; label: string; emoji: string; copy: string }> = [
  { value: 'semangat', label: 'Semangat', emoji: '🔥', copy: 'siap bergerak' },
  { value: 'normal', label: 'Normal', emoji: '🙂', copy: 'stabil' },
  { value: 'capek', label: 'Capek', emoji: '🫠', copy: 'butuh pelan-pelan' },
  { value: 'tertekan', label: 'Berat', emoji: '🌧️', copy: 'butuh dirapikan' },
]

const defaultGoals = [
  'Selesaikan 1 deadline paling dekat',
  'Rapikan jadwal kuliah hari ini',
  'Masuk Study Room minimal 15 menit',
  'Cari 1 teman belajar / tim Arena',
]

function getTodayCopy(pulse: DailyPulse | null) {
  if (!pulse) return 'Pilih target kecil, lalu jalankan hari tanpa pura-pura semuanya aman.'
  if (pulse.pendingToday > 0) return `${pulse.pendingToday} deadline hari ini masih menunggu. Kerjakan satu per satu.`
  if (pulse.completedToday > 0) return `Hari ini sudah ada ${pulse.completedToday} deadline selesai. Ritmenya lumayan waras.`
  return 'Belum ada deadline hari ini. Pakai waktunya untuk menyiapkan tugas berikutnya.'
}

function dayLabel(value: string) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(new Date(`${value}T00:00:00`))
}

export default function DailyPulseCard() {
  const [pulse, setPulse] = useState<DailyPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [mood, setMood] = useState<DailyMood>('normal')
  const [focusGoal, setFocusGoal] = useState(defaultGoals[0])
  const [checkinNote, setCheckinNote] = useState('')
  const [checkoutMood, setCheckoutMood] = useState<DailyMood>('normal')
  const [checkoutNote, setCheckoutNote] = useState('')
  const [goalCompleted, setGoalCompleted] = useState(true)

  const retentionLine = useMemo(() => getTodayCopy(pulse), [pulse])

  async function loadPulse() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/daily-pulse', { cache: 'no-store' })
      const result = (await response.json().catch(() => null)) as DailyPulseResponse | null
      if (!response.ok || !result?.data) throw new Error(result?.error || 'Daily Pulse belum bisa dimuat.')
      setPulse(result.data)
      if (result.data.mood) setMood(result.data.mood)
      if (result.data.focusGoal) setFocusGoal(result.data.focusGoal)
      if (result.data.checkinNote) setCheckinNote(result.data.checkinNote)
      if (result.data.checkoutMood) setCheckoutMood(result.data.checkoutMood)
      if (result.data.checkoutNote) setCheckoutNote(result.data.checkoutNote)
      if (typeof result.data.goalCompleted === 'boolean') setGoalCompleted(result.data.goalCompleted)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Daily Pulse gagal dimuat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadPulse() }, [])

  async function submit(mode: 'checkin' | 'checkout') {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/daily-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'checkin'
          ? { mode, mood, focusGoal, checkinNote }
          : { mode, checkoutMood, checkoutNote, goalCompleted }),
      })
      const result = (await response.json().catch(() => null)) as DailyPulseResponse | null
      if (!response.ok || !result?.data) throw new Error(result?.error || 'Daily Pulse gagal disimpan.')
      setPulse(result.data)
      setMessage(mode === 'checkin' ? 'Target hari ini tersimpan.' : 'Hari ini sudah ditutup dan masuk histori.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Daily Pulse gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden border-orange-100/80 bg-gradient-to-br from-white via-orange-50/50 to-indigo-50/60">
      <CardContent className="p-0">
        <div className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">Daily Pulse</Badge>
                <Badge tone={pulse?.checkedOut ? 'success' : pulse?.checkedIn ? 'info' : 'neutral'}>
                  {pulse?.checkedOut ? 'Hari ditutup' : pulse?.checkedIn ? 'Sudah check-in' : 'Belum check-in'}
                </Badge>
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">Mulai dengan target, tutup dengan evaluasi.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{retentionLine}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-lg">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-orange-600"><Flame className="h-4 w-4" /><span className="text-xs font-black uppercase">Streak</span></div>
                  <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : pulse?.currentStreak ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-600"><CheckCircle2 className="h-4 w-4" /><span className="text-xs font-black uppercase">Selesai</span></div>
                  <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : pulse?.completedToday ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600"><Trophy className="h-4 w-4" /><span className="text-xs font-black uppercase">Poin</span></div>
                  <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : pulse?.pointsToday ?? 0}</p>
                </div>
              </div>

              {(pulse?.recentDays?.length ?? 0) > 0 && (
                <div className="mt-4 max-w-lg rounded-2xl border border-white/80 bg-white/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Ritme 7 hari</p>
                    <p className="text-[10px] font-bold text-slate-400">Hijau = target tercapai</p>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {pulse?.recentDays.map((day) => (
                      <div key={day.activityDate} className="text-center">
                        <div title={day.activityDate} className={`mx-auto h-7 w-7 rounded-xl ${day.goalCompleted === true ? 'bg-emerald-500' : day.checkedOut ? 'bg-amber-300' : 'bg-slate-200'}`} />
                        <span className="mt-1 block text-[9px] font-black uppercase text-slate-400">{dayLabel(day.activityDate)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full rounded-3xl border border-white/80 bg-white/85 p-4 shadow-xl shadow-orange-200/30 lg:max-w-md">
              {loading ? (
                <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat Daily Pulse...</div>
              ) : error && !pulse ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><p className="font-black">Daily Pulse belum aktif.</p><p className="mt-1">{error}</p></div>
              ) : pulse?.checkedOut ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"><MoonStar className="h-5 w-5" /></div>
                    <div><p className="font-black text-slate-950">Hari ini sudah ditutup.</p><p className="mt-1 text-sm leading-6 text-slate-500">Target: {pulse.goalCompleted ? 'tercapai' : 'belum tercapai'} · Mood akhir: {pulse.checkoutMood ?? 'normal'}.</p></div>
                  </div>
                  {pulse.checkoutNote && <div className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">“{pulse.checkoutNote}”</div>}
                  <div className={`rounded-2xl border p-3 text-sm font-bold ${pulse.goalCompleted ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
                    {pulse.goalCompleted ? 'Target kecil selesai. Besok tinggal jaga ritme.' : 'Belum selesai bukan kiamat. Besok targetnya dibuat lebih kecil dan realistis.'}
                  </div>
                </div>
              ) : pulse?.checkedIn ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CalendarCheck2 className="h-5 w-5" /></div>
                    <div><p className="font-black text-slate-950">Target hari ini</p><p className="mt-1 text-sm leading-6 text-slate-500">{pulse.focusGoal || 'Jalani hari ini dengan target yang lebih jelas.'}</p></div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Targetnya tercapai?</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setGoalCompleted(true)} className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-black ${goalCompleted ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}><CheckCircle2 className="h-4 w-4" /> Tercapai</button>
                      <button type="button" onClick={() => setGoalCompleted(false)} className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-sm font-black ${!goalCompleted ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`}><XCircle className="h-4 w-4" /> Belum</button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Mood akhir hari</label>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {moodOptions.map((item) => (
                        <button key={item.value} type="button" title={item.label} onClick={() => setCheckoutMood(item.value)} className={`rounded-xl border p-2 text-center text-lg ${checkoutMood === item.value ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'}`}>{item.emoji}</button>
                      ))}
                    </div>
                  </div>

                  <textarea value={checkoutNote} onChange={(event) => setCheckoutNote(event.target.value)} rows={3} maxLength={240} placeholder="Apa yang bikin lancar atau berantakan hari ini?" className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
                  {error && <p className="text-sm font-bold text-red-600">{error}</p>}
                  {message && <p className="text-sm font-bold text-emerald-700">{message}</p>}
                  <Button type="button" onClick={() => void submit('checkout')} disabled={saving} className="w-full rounded-2xl">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoonStar className="h-4 w-4" />} Tutup hari ini
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Mood hari ini</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {moodOptions.map((item) => (
                        <button key={item.value} type="button" onClick={() => setMood(item.value)} className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${mood === item.value ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-slate-200 bg-white hover:border-orange-200'}`}>
                          <span className="text-lg">{item.emoji}</span><span className="ml-2 text-sm font-black text-slate-900">{item.label}</span><p className="mt-1 text-[11px] font-semibold text-slate-400">{item.copy}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Target kecil</label>
                    <select value={focusGoal} onChange={(event) => setFocusGoal(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                      {defaultGoals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Catatan opsional</label>
                    <textarea value={checkinNote} onChange={(event) => setCheckinNote(event.target.value)} rows={3} maxLength={180} placeholder="Contoh: fokus tugas AP2B dulu." className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                  </div>
                  {error && <p className="text-sm font-bold text-red-600">{error}</p>}
                  {message && <p className="text-sm font-bold text-emerald-700">{message}</p>}
                  <Button type="button" onClick={() => void submit('checkin')} disabled={saving} className="w-full rounded-2xl">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Check-in hari ini
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-5 rounded-2xl border border-orange-100 bg-white/65 p-3 text-xs leading-5 text-slate-500">
            <span className="inline-flex items-center gap-1 font-black text-slate-700"><Target className="h-3.5 w-3.5" /> Kenapa ada check-out?</span>{' '}
            Karena target tanpa evaluasi cuma resolusi mini yang nasibnya sama seperti resolusi tahun baru: ditulis, lalu dilupakan.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
