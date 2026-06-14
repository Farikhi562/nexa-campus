'use client'

import type { MouseEventHandler } from 'react'
import type { NexaBadge } from '@/lib/badges/catalog'
import { BADGE_RARITY_LABEL } from '@/lib/badges/catalog'

type NexaBadgeCardProps = {
  badge: NexaBadge
  compact?: boolean
  locked?: boolean
  earned?: boolean
  pinned?: boolean
  showDescription?: boolean
  showRequirement?: boolean
  onClick?: MouseEventHandler<HTMLElement>
}

const CARD_CLASS: Record<NexaBadge['rarity'], string> = {
  biasa: 'nexa-badge-card nexa-badge-biasa border-slate-200 bg-white',
  langka: 'nexa-badge-card nexa-badge-langka border-sky-300/80 bg-sky-50',
  epic: 'nexa-badge-card nexa-badge-epic border-violet-300/80 bg-violet-50',
  legend: 'nexa-badge-card nexa-badge-legend border-amber-300/90 bg-amber-50',
  mythos: 'nexa-badge-card nexa-badge-mythos border-fuchsia-300/70 bg-slate-950',
}

const TEXT_CLASS: Record<NexaBadge['rarity'], string> = {
  biasa: 'text-slate-950',
  langka: 'text-sky-950',
  epic: 'text-violet-950',
  legend: 'text-amber-950',
  mythos: 'text-white',
}

export default function NexaBadgeCard({
  badge,
  compact = false,
  locked = false,
  earned = !locked,
  pinned = false,
  showDescription = true,
  showRequirement = true,
  onClick,
}: NexaBadgeCardProps) {
  const clickable = Boolean(onClick)

  return (
    <article
      className={`${CARD_CLASS[badge.rarity]} ${TEXT_CLASS[badge.rarity]} ${locked ? 'nexa-badge-locked' : ''} ${compact ? 'rounded-2xl p-3' : 'rounded-[1.7rem] p-4 sm:p-5'} ${clickable ? 'focus:outline-none focus:ring-2 focus:ring-teal-400' : ''}`}
      title={`${badge.name} · ${BADGE_RARITY_LABEL[badge.rarity]}`}
      data-rarity={badge.rarity}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!clickable) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).click()
        }
      }}
    >
      <div className="nexa-badge-glow" />
      <div className="nexa-badge-shine" />

      <div className="nexa-badge-inner relative z-10">
        <div className={compact ? 'flex items-center gap-3' : 'flex items-start gap-4'}>
          <div className={`${compact ? 'h-12 w-12 text-2xl' : 'h-16 w-16 text-4xl'} nexa-badge-medal shrink-0`}>
            <span className="relative z-10 leading-none">{badge.emoji}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`${compact ? 'text-sm' : 'text-base sm:text-lg'} min-w-0 truncate font-black tracking-tight nexa-badge-title`}>
                {badge.name}
              </h3>
              <span className={`nexa-rarity-pill nexa-rarity-${badge.rarity}`}>{BADGE_RARITY_LABEL[badge.rarity]}</span>
              {pinned ? <span className="nexa-badge-status-pill">Tampil</span> : null}
            </div>

            {showDescription && !compact ? <p className="nexa-badge-description mt-2 text-sm leading-6">{badge.description}</p> : null}
            {showRequirement && !compact ? (
              <p className="nexa-badge-requirement mt-3 rounded-2xl border border-black/5 bg-white/45 px-3 py-2 text-xs leading-5">
                <span className="font-black">Syarat:</span> {badge.requirement}
              </p>
            ) : null}
            {!compact ? (
              <div className="nexa-badge-meta mt-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                <span>{badge.category.replace('_', ' ')}</span>
                <span>•</span>
                <span>{badge.animated ? 'Animated' : 'Static'}</span>
                <span>•</span>
                <span>{earned ? 'Unlocked' : 'Locked'}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {locked ? (
        <div className="nexa-badge-lock-overlay">
          <div className="nexa-badge-lock-icon text-xl">🔒</div>
          <div className="nexa-badge-lock-copy">
            <div className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Belum kebuka</div>
            <div className="mt-1 text-sm font-black sm:text-base">{badge.name}</div>
            {!compact ? <p className="mt-2 text-xs leading-5 opacity-90">{badge.requirement}</p> : null}
          </div>
        </div>
      ) : null}
    </article>
  )
}
