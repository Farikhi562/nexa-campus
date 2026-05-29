'use client'

import Link from 'next/link'
import { Lock, Sparkles, X } from 'lucide-react'
import Button from './ui/Button'
import { PRO_PRICE } from '@/lib/plans'
import { useState } from 'react'

const PRO_FEATURES = [
  'Chat with PDF dan ringkasan otomatis',
  'Analisis kelemahan AI',
  'Study Room private dan custom branding',
  'Tim belajar permanen dan share dokumen',
  'Semua 15 Campus Tools tanpa batas',
  'Export Anki, Quizlet, dan Word',
  'Laporan mingguan Telegram',
]

export default function ProUpgradeModal({
  open,
  feature,
  onClose,
}: {
  open: boolean
  feature: string
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-brand-700">Fitur khusus Pro</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{feature}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Upgrade ke Pro untuk membuka fitur ini dan seluruh workflow premium NEXA Campus.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-brand-950">Pro</span>
            <span className="text-lg font-black text-brand-950">{PRO_PRICE}/bulan</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-brand-800">Untuk power user, tim belajar, dan semester padat.</p>
        </div>

        {expanded && (
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
            {PRO_FEATURES.map((item) => (
              <li key={item} className="flex gap-2">
                <Sparkles className="mt-1 h-4 w-4 flex-shrink-0 text-brand-600" />
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/checkout?plan=pro">
            <Button type="button" fullWidth>Upgrade ke Pro</Button>
          </Link>
          <Button type="button" variant="outline" onClick={() => setExpanded((value) => !value)} fullWidth>
            {expanded ? 'Ringkas fitur' : 'Lihat semua fitur Pro'}
          </Button>
        </div>
      </div>
    </div>
  )
}
