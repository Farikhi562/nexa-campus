'use client'

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { cn } from '@/lib/utils'

const realLogoPath = '/brand/nexa-campus-logo.png'
const placeholderLogoPath = '/brand/nexa-campus-logo-placeholder.svg'

type NexaCampusLogoProps = {
  className?: string
  imageClassName?: string
  showText?: boolean
  tone?: 'light' | 'dark'
}

export default function NexaCampusLogo({
  className,
  imageClassName,
  showText = true,
  tone = 'light',
}: NexaCampusLogoProps) {
  const [src, setSrc] = useState(realLogoPath)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* TODO: Replace placeholder logo with final official NEXA Campus logo asset. */}
      <img
        src={src}
        alt="NEXA Campus"
        onError={() => {
          if (src !== placeholderLogoPath) setSrc(placeholderLogoPath)
        }}
        className={cn('h-11 w-11 rounded-2xl object-contain shadow-sm', imageClassName)}
      />
      {showText && (
        <div>
          <p
            className={cn(
              'text-lg font-black leading-5 tracking-tight',
              tone === 'dark' ? 'text-white' : 'text-slate-950'
            )}
          >
            NEXA Campus
          </p>
          <p
            className={cn(
              'text-[10px] font-bold uppercase tracking-[0.22em]',
              tone === 'dark' ? 'text-teal-200' : 'text-teal-600'
            )}
          >
            Deadline Radar
          </p>
        </div>
      )}
    </div>
  )
}
