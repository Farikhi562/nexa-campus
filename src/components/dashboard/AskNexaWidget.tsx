'use client'

import { LockKeyhole, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

export default function AskNexaWidget() {
  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-950">Ask NEXA</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Locked preview untuk NEXA Command. Belum live di MVP beta ini.
            </p>
          </div>
          <Badge tone="info">Locked Preview</Badge>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-teal-200 bg-white/70 p-4 text-sm leading-6 text-slate-600">
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-700" />
            <p>
              Roadmap: tanya cara merapikan deadline, baca prioritas minggu ini, dan bantu bikin checklist.
              Untuk sekarang, dashboard tetap fokus ke deadline manual yang aman.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
