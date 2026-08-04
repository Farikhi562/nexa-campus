import NexaLogo from '@/components/NexaLogo'

type LoadingScreenProps = {
  /** Teks kecil di bawah logo. Default cocok untuk loading halaman dashboard umum. */
  label?: string
  /**
   * "full"   — splash sepenuh layar, dipakai saat pertama masuk /dashboard.
   * "compact"— versi ringkas untuk perpindahan antar halaman di dalam dashboard,
   *            supaya nggak berat/berulang tiap klik menu.
   */
  size?: 'full' | 'compact'
  className?: string
}

/**
 * Loading screen bermerek NEXA Campus. Dipakai sebagai isi default `loading.tsx`
 * di App Router (fallback Suspense otomatis dari Next.js), jadi satu komponen ini
 * mengontrol "rasa" loading di seluruh aplikasi — bukan skeleton generik yang beda-beda
 * tiap halaman.
 */
export default function LoadingScreen({ label = 'Menyiapkan halaman kamu…', size = 'full', className = '' }: LoadingScreenProps) {
  const isFull = size === 'full'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-4 ${isFull ? 'min-h-[70vh] py-16' : 'py-10'} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute h-16 w-16 rounded-full bg-blue-400/25 blur-xl animate-pulse-glow"
        />
        <NexaLogo className={`relative animate-float ${isFull ? 'h-14 w-14' : 'h-10 w-10'}`} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className={`font-black tracking-tight text-slate-400 ${isFull ? 'text-sm' : 'text-xs'}`}>{label}</p>
        <span className="h-1 w-24 overflow-hidden rounded-full bg-slate-100">
          <span className="block h-full w-full nexa-loading-bar" />
        </span>
      </div>
    </div>
  )
}
