'use client'

import { AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03] backdrop-blur">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <p className="text-base font-black text-slate-950">Halaman ini gagal dimuat</p>
        <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
          Coba muat ulang. Kalau masih gagal setelah beberapa kali, coba lagi dalam beberapa menit.
        </p>
      </div>
      <Button className="mt-1" onClick={reset}>
        Coba Lagi
      </Button>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2 w-full max-w-sm rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left text-xs text-slate-500">
          <summary className="cursor-pointer font-bold">Detail teknis (dev only)</summary>
          <p className="mt-1.5 whitespace-pre-wrap break-words">{error.message || 'unknown error'}{error.digest ? ` (digest: ${error.digest})` : ''}</p>
        </details>
      )}
    </div>
  )
}
