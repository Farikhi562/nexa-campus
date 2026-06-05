import { cn } from '@/lib/utils'

// Logo mark NEXA Campus: topi wisuda + monogram N + buku terbuka.
// Warna mengikuti brand (teal). Ukuran diatur lewat className (default kotak).
export default function NexaLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-teal-100',
        className
      )}
      aria-label="NEXA Campus"
    >
      <svg viewBox="0 0 64 64" className="h-[80%] w-[80%]" role="img" aria-hidden="true">
        {/* Topi wisuda */}
        <path d="M32 8 L58 18 L32 28 L6 18 Z" fill="#0d9488" />
        <path d="M14 23 L14 35 C14 40 22 44 32 44 C42 44 50 40 50 35 L50 23 L32 31 Z" fill="#0f766e" />
        {/* Tassel */}
        <path d="M58 18 L58 30" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
        <circle cx="58" cy="32" r="2.6" fill="#14b8a6" />
        {/* Monogram N */}
        <path
          d="M24 39 L24 23 L28.5 23 L36 33 L36 23 L40 23 L40 39 L35.5 39 L28 29 L28 39 Z"
          fill="#ffffff"
        />
        {/* Buku terbuka */}
        <path d="M32 46 C26 42 16 42 8 45 L8 53 C16 50 26 50 32 54 Z" fill="#0d9488" />
        <path d="M32 46 C38 42 48 42 56 45 L56 53 C48 50 38 50 32 54 Z" fill="#14b8a6" />
      </svg>
    </span>
  )
}
