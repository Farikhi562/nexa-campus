import { BADGES } from '@/lib/badges'

export default function BadgesGrid({ earned }: { earned: string[] }) {
  const earnedSet = new Set(earned)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BADGES.map((badge) => {
        const unlocked = earnedSet.has(badge.id)
        return (
          <div
            key={badge.id}
            className={`rounded-xl border p-4 text-center transition ${
              unlocked
                ? 'border-brand-200 bg-brand-50 text-slate-950'
                : 'border-slate-200 bg-slate-50 text-slate-400 grayscale'
            }`}
          >
            <div className="text-3xl">{badge.icon}</div>
            <p className="mt-2 text-sm font-black">{badge.title}</p>
            <p className="mt-1 text-xs leading-5">{badge.description}</p>
          </div>
        )
      })}
    </div>
  )
}
