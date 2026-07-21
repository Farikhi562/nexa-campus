import { CalendarRange, Flame, RotateCcw, Trophy } from 'lucide-react'

export type FocusHeatmapDay = {
  date: string
  minutes: number
}

function intensity(minutes: number) {
  if (minutes <= 0) return 'bg-slate-100'
  if (minutes < 25) return 'bg-blue-200'
  if (minutes < 50) return 'bg-blue-400'
  if (minutes < 90) return 'bg-blue-600'
  return 'bg-slate-950'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`))
}

export default function FocusHeatmap({
  days,
  currentStreak,
  bestStreak,
  recoveryStreak,
}: {
  days: FocusHeatmapDay[]
  currentStreak: number
  bestStreak: number
  recoveryStreak: boolean
}) {
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7))
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0)
  const activeDays = days.filter((day) => day.minutes > 0).length

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
            <CalendarRange className="h-3.5 w-3.5" /> 12 minggu terakhir
          </div>
          <h2 className="mt-3 text-xl font-black text-slate-950">Jejak fokus, bukan jejak buka laptop.</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Semakin gelap kotaknya, semakin banyak menit fokus yang benar-benar tercatat.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-orange-600"><Flame className="h-3.5 w-3.5" /> Current</div>
            <p className="mt-1 text-xl font-black text-slate-950">{currentStreak} hari</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-violet-600"><Trophy className="h-3.5 w-3.5" /> Terbaik</div>
            <p className="mt-1 text-xl font-black text-slate-950">{bestStreak} hari</p>
          </div>
          <div className={`rounded-2xl px-4 py-3 ${recoveryStreak ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <div className={`flex items-center gap-1.5 text-xs font-black ${recoveryStreak ? 'text-amber-700' : 'text-emerald-700'}`}><RotateCcw className="h-3.5 w-3.5" /> Status</div>
            <p className="mt-1 text-sm font-black text-slate-950">{recoveryStreak ? 'Jaga hari ini' : 'Aman hari ini'}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1.5">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${formatDate(day.date)} · ${day.minutes} menit`}
                  className={`h-4 w-4 rounded-[5px] transition hover:scale-125 ${intensity(day.minutes)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-xs font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>{activeDays} hari aktif · {totalMinutes} menit fokus dalam 12 minggu</p>
        <div className="flex items-center gap-1.5"><span>Sedikit</span><span className="h-3 w-3 rounded bg-slate-100" /><span className="h-3 w-3 rounded bg-blue-200" /><span className="h-3 w-3 rounded bg-blue-400" /><span className="h-3 w-3 rounded bg-blue-600" /><span className="h-3 w-3 rounded bg-slate-950" /><span>Banyak</span></div>
      </div>
    </section>
  )
}
