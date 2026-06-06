import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * NexaCampusLogo — full wordmark: logo mark + "NEXA Campus" teks.
 * Gunakan di landing page, login, onboarding.
 * Versi SVG inline agar scale sempurna + tidak butuh request tambahan.
 */
export default function NexaCampusLogo({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dims = { sm: 'h-16', md: 'h-24', lg: 'h-32' }

  return (
    <span className={cn('inline-flex flex-col items-center gap-2', className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('w-auto', dims[size])}
        role="img"
        aria-label="NEXA Campus"
      >
        {/* Buku */}
        <path d="M50 72 C43 65 27 63 10 67 L10 78 C27 74 43 75 50 82 Z" fill="#0d9488" />
        <path d="M50 72 C57 65 73 63 90 67 L90 78 C73 74 57 75 50 82 Z" fill="#14b8a6" />
        <path d="M48.5 72 L48.5 83 Q50 84.5 51.5 83 L51.5 72 Q50 70.5 48.5 72 Z" fill="#0a7d74" />
        {/* Arch + kolom */}
        <path
          d="M22 72 L22 52 C22 34 78 34 78 52 L78 72 L70 72 L70 54 C70 42 30 42 30 54 L30 72 Z"
          fill="#14b8a6"
        />
        <path
          d="M22 52 C22 34 78 34 78 52 C78 42 70 36 50 34 C30 36 22 42 22 52 Z"
          fill="#0d9488"
        />
        {/* Huruf N */}
        <path
          d="M34 70 L34 42 L40 42 L50 59 L60 42 L66 42 L66 70 L61 70 L61 51 L50 65 L39 51 L39 70 Z"
          fill="white"
        />
        {/* Topi wisuda */}
        <path d="M12 28 L50 16 L88 28 L50 38 Z" fill="#0d9488" />
        <path d="M32 31 L32 38 Q32 44 50 46 Q68 44 68 38 L68 31 L50 36 Z" fill="#0a7d74" />
        <path d="M88 28 Q93 30 93 36 L93 44" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="93" cy="47" r="3.5" fill="#0d9488" />
        <path d="M90 50 Q93 54 96 50" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      {/* Wordmark teks */}
      <span className="flex flex-col items-center leading-none">
        <span
          className="font-black tracking-[0.15em] text-teal-600"
          style={{ fontSize: size === 'sm' ? '1.1rem' : size === 'md' ? '1.5rem' : '2rem' }}
        >
          NEXA
        </span>
        <span
          className="font-semibold tracking-widest text-[#1e3a5f]"
          style={{ fontSize: size === 'sm' ? '0.65rem' : size === 'md' ? '0.85rem' : '1.1rem' }}
        >
          Campus
        </span>
      </span>
    </span>
  )
}

/**
 * NexaLogoPng — gunakan gambar asli PNG via next/image.
 * Cocok untuk OG image, email, konteks yang butuh gambar raster.
 */
export function NexaLogoPng({ size = 80, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-nexa-campus.png"
      alt="NEXA Campus"
      width={size}
      height={size}
      className={cn('object-contain', className)}
      priority
    />
  )
}
