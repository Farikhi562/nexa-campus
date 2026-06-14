'use client'

import type { NexaBadge } from '@/lib/badges/catalog'
import { BADGE_RARITY_LABEL } from '@/lib/badges/catalog'

type NexaBadgeCardProps = {
  badge: NexaBadge
  compact?: boolean
  locked?: boolean
  showDescription?: boolean
}

const RARITY_CLASS: Record<NexaBadge['rarity'], string> = {
  biasa: 'nexa-badge-card nexa-badge-biasa border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100',
  langka: 'nexa-badge-card nexa-badge-langka border-sky-200/80 bg-sky-50 text-sky-950 dark:border-sky-400/30 dark:bg-sky-950/30 dark:text-sky-100',
  epic: 'nexa-badge-card nexa-badge-epic border-violet-300/70 bg-violet-50 text-violet-950 dark:border-violet-400/30 dark:bg-violet-950/30 dark:text-violet-100',
  legend: 'nexa-badge-card nexa-badge-legend border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-300/40 dark:bg-amber-950/30 dark:text-amber-100',
  mythos: 'nexa-badge-card nexa-badge-mythos border-fuchsia-300/80 bg-fuchsia-50 text-white dark:border-fuchsia-300/40 dark:bg-fuchsia-950/30',
}

export default function NexaBadgeCard({ badge, compact = false, locked = false, showDescription = true }: NexaBadgeCardProps) {
  return (
    <article
      className={`${RARITY_CLASS[badge.rarity]} ${compact ? 'rounded-2xl p-3' : 'rounded-[1.7rem] p-4 sm:p-5'} ${locked ? 'opacity-45 grayscale' : ''}`}
      title={`${badge.name} · ${BADGE_RARITY_LABEL[badge.rarity]}`}
    >
      <div className="nexa-badge-glow" />
      <div className="nexa-badge-shine" />

      <div className={compact ? 'flex items-center gap-3' : 'flex items-start gap-4'}>
        <div className={`${compact ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-4xl'} nexa-badge-medal shrink-0`}>
          <span className="relative z-10">{badge.emoji}</span>
        </div>

        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`${compact ? 'text-sm' : 'text-base sm:text-lg'} truncate font-black tracking-tight`}>
              {badge.name}
            </h3>
            <span className={`nexa-rarity-pill nexa-rarity-${badge.rarity}`}>
              {BADGE_RARITY_LABEL[badge.rarity]}
            </span>
          </div>
          {showDescription && !compact ? (
            <p className="mt-2 text-sm leading-6 opacity-80">{badge.description}</p>
          ) : null}
          {!compact ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
              <span>{badge.category.replace('_', ' ')}</span>
              <span>•</span>
              <span>{badge.animated ? 'Animated' : 'Static'}</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
