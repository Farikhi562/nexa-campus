'use client'

/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { ImageIcon, Radar } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

type ProductPreviewCardProps = {
  title: string
  description: string
  imageSrc: string
  placeholderLabel: string
  alt: string
}

export default function ProductPreviewCard({
  title,
  description,
  imageSrc,
  placeholderLabel,
  alt,
}: ProductPreviewCardProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        {!imageFailed ? (
          <img
            src={imageSrc}
            alt={alt}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="relative flex h-full flex-col justify-between p-5 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(45,212,191,0.28),transparent_16rem)]" />
            <div className="relative flex items-center justify-between">
              <Badge tone="info" className="bg-cyan-200/10 text-cyan-100 ring-cyan-200/20">
                Preview Placeholder
              </Badge>
              <Radar className="h-5 w-5 text-teal-200" />
            </div>
            <div className="relative grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.07] p-3"
                  >
                    <div className="h-3 w-10 rounded-full bg-teal-200/50" />
                    <div className="mt-3 h-5 w-8 rounded-lg bg-white/20" />
                  </div>
                ))}
              </div>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                >
                  <div className="h-9 w-9 rounded-2xl bg-teal-300/15" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-2/3 rounded-full bg-white/30" />
                    <div className="mt-2 h-2 w-1/2 rounded-full bg-white/15" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-teal-300/20" />
                </div>
              ))}
            </div>
            <div className="relative flex items-center gap-2 text-xs font-bold text-slate-300">
              <ImageIcon className="h-4 w-4 text-teal-200" />
              {placeholderLabel}
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  )
}
