'use client'

import Button from '@/components/ui/Button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
      <p className="text-lg font-black">Dashboard gagal dimuat.</p>
      <p className="mt-2 text-sm leading-6">
        Ada error saat membaca deadline. Detail singkat: {error.message || 'unknown error'}.
      </p>
      <Button className="mt-4" onClick={reset}>
        Coba Lagi
      </Button>
    </div>
  )
}
