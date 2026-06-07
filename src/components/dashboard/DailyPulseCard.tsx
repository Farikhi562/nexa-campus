'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck2, CheckCircle2, Flame, Loader2, Sparkles, Target, Trophy } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

type DailyMood = 'semangat' | 'normal' | 'capek' | 'tertekan'

type DailyPulse = {
  checkedIn: boolean
  activityDate: string
  mood: DailyMood | null
  focusGoal: string | null
  checkinNote: string | null
  pointsAwarded: number
  currentStreak: number
  totalCheckins: number
  completedToday: number
  pendingToday: number
  pointsToday: number
}

type DailyPulseResponse = {
  data?: DailyPulse
  error?: string
}

const moodOptions: Array<{ value: DailyMood; label: string; emoji: string; copy: string }> = [
  { value: 'semangat', label: 'Gas', emoji: '🔥', copy: 'mode ngebut' },
  { value: 'normal', label: 'Normal', emoji: '🙂', copy: 'cukup waras' },
  { value: 'capek', label: 'Capek', emoji: '🫠', copy: 'pelan tapi jalan' },
  { value: 'tertekan', label: 'Berat', emoji: '🌧️', copy: 'butuh ditata' },
]

const defaultGoals = [
  'Beresin 1 deadline paling dekat',
  'Rapihin jadwal kuliah hari ini',
  'Masuk Study Room minimal 15 menit',
  'Cari 1 teman belajar / tim Arena',
]

function getTodayCopy(pulse: DailyPulse | null) {
  if (!pulse) return 'Buka dashboard, pilih target, lalu pulang lagi besok. Manipulasi dopamine, tapi yang legal.'
  if (pulse.pendingToday > 0) return `${pulse.pendingToday} deadline hari ini masih nunggu. Tenang, satu-satu, bukan duel final.`
  if (pulse.completedToday > 0) return `Hari ini sudah ada ${pulse.completedToday} deadline selesai. Ini baru manusia fungsional, sedikit mengejutkan.`
  return 'Belum ada deadline hari ini. Pakai waktunya buat siap-siap, bukan scroll tanpa arah seperti tradisi nasional.'
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

  const retentionLine = useMemo(() => getTodayCopy(pulse), [pulse])

  async function loadPulse() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/daily-pulse', { cache: 'no-store' })
      const result = (await response.json().catch(() => null)) as DailyPulseResponse | null

      if (!response.ok || !result?.data) {
        setError(result?.error || 'Daily Pulse belum bisa dimuat.')
        setLoading(false)
        return
      }

      setPulse(result.data)
      if (result.data.mood) setMood(result.data.mood)
      if (result.data.focusGoal) setFocusGoal(result.data.focusGoal)
      if (result.data.checkinNote) setCheckinNote(result.data.checkinNote)
    } catch {
      setError('Daily Pulse gagal dimuat. Internet atau server lagi drama kecil.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPulse()
  }, [])

  async function submitCheckin() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/daily-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, focusGoal, checkinNote }),
      })
      const result = (await response.json().catch(() => null)) as DailyPulseResponse | null

      if (!response.ok || !result?.data) {
        setError(result?.error || 'Check-in gagal disimpan.')
        setSaving(false)
        return
      }

      setPulse(result.data)
      setMessage(result.data.checkedIn ? 'Check-in hari ini aman. Besok balik lagi, biar streak-nya nggak wafat sia-sia.' : 'Daily Pulse tersimpan.')
    } catch {
      setError('Check-in gagal. Server lagi menguji kesabaran umat manusia.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden border-cyan-100/80 bg-gradient-to-br from-white via-cyan-50/50 to-indigo-50/60">
      <CardContent className="p-0">
        <div className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">Daily Pulse v1.5.23</Badge>
                <Badge tone={pulse?.checkedIn ? 'success' : 'info'}>
                  {pulse?.checkedIn ? 'Sudah check-in' : 'Belum check-in'}
                </Badge>
              </div>

              <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                Bikin user balik tiap hari, mulai dari ritual 20 detik.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{retentionLine}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-lg">
                <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Flame className="h-4 w-4" />
                    <span className="text-xs font-black uppercase">Streak</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : pulse?.currentStreak ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-teal-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-black uppercase">Selesai</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : pulse?.completedToday ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Trophy className="h-4 w-4" />
                    <span className="text-xs font-black uppercase">Poin</span>
                  </div>
                  <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '...' : pulse?.pointsToday ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-3xl border border-white/80 bg-white/85 p-4 shadow-xl shadow-cyan-200/30 lg:max-w-md">
              {loading ? (
                <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat Daily Pulse...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  <p className="font-black">Daily Pulse belum aktif.</p>
                  <p className="mt-1">{error}</p>
                </div>
              ) : pulse?.checkedIn ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <CalendarCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-950">Target hari ini sudah dikunci.</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{pulse.focusGoal || 'Jalanin hari ini dengan lebih sadar, bukan autopilot doang.'}</p>
                    </div>
                  </div>
                  {pulse.checkinNote && (
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      “{pulse.checkinNote}”
                    </div>
                  )}
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                    +{pulse.pointsAwarded || 3} poin check-in hari ini sudah diamankan.
                  </div>
                  {message && <p className="text-xs font-bold text-emerald-700">{message}</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Mood hari ini</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {moodOptions.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setMood(item.value)}
                          className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${mood === item.value ? 'border-cyan-300 bg-cyan-50 shadow-sm' : 'border-slate-200 bg-white hover:border-cyan-200'}`}
                        >
                          <span className="text-lg">{item.emoji}</span>
                          <span className="ml-2 text-sm font-black text-slate-900">{item.label}</span>
                          <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.copy}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Target kecil</label>
                    <select
                      value={focusGoal}
                      onChange={(event) => setFocusGoal(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                      {defaultGoals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-500">Catatan opsional</label>
                    <textarea
                      value={checkinNote}
                      onChange={(event) => setCheckinNote(event.target.value)}
                      rows={3}
                      maxLength={180}
                      placeholder="Contoh: hari ini mau fokus AP2B dulu."
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    />
                  </div>

                  {error && <p className="text-sm font-bold text-red-600">{error}</p>}
                  {message && <p className="text-sm font-bold text-emerald-700">{message}</p>}

                  <Button type="button" onClick={submitCheckin} disabled={saving} className="w-full rounded-2xl">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Check-in hari ini
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="relative mt-5 rounded-2xl border border-cyan-100 bg-white/65 p-3 text-xs leading-5 text-slate-500">
            <span className="inline-flex items-center gap-1 font-black text-slate-700"><Target className="h-3.5 w-3.5" /> Kenapa ini dulu?</span>{' '}
            Karena fitur yang bikin betah bukan selalu yang paling canggih, tapi yang bikin user punya alasan balik besok.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
