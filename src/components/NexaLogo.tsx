import { cn } from '@/lib/utils'

/**
 * NexaLogo — mark/icon hanya (tanpa teks).
 * Setia ke logo asli: topi wisuda + gerbang arch + N + buku terbuka.
 * Digunakan di header, sidebar, favicon-like contexts.
 * Ukuran dikontrol lewat className (default h-10 w-10).
 */
export default function NexaLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn('relative inline-flex flex-shrink-0 items-center justify-center', className)}
      aria-label="NEXA Campus"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        role="img"
        aria-hidden="true"
      >
        {/* === BUKU TERBUKA (bawah) === */}
        <path
          d="M50 72 C43 65 27 63 10 67 L10 78 C27 74 43 75 50 82 Z"
          fill="#0d9488"
        />
        <path
          d="M50 72 C57 65 73 63 90 67 L90 78 C73 74 57 75 50 82 Z"
          fill="#14b8a6"
        />
        {/* Spine buku */}
        <path d="M48.5 72 L48.5 83 Q50 84.5 51.5 83 L51.5 72 Q50 70.5 48.5 72 Z" fill="#0a7d74" />

        {/* === GERBANG ARCH + KOLOM (tengah) === */}
        {/* Bentuk portal: dua kolom + arch atas, hollow di tengah untuk huruf N */}
        <path
          d="M22 72 L22 52 C22 34 78 34 78 52 L78 72 L70 72 L70 54 C70 42 30 42 30 54 L30 72 Z"
          fill="#14b8a6"
        />
        {/* Arch top fill (bagian atas gerbang) */}
        <path
          d="M22 52 C22 34 78 34 78 52 C78 42 70 36 50 34 C30 36 22 42 22 52 Z"
          fill="#0d9488"
        />

        {/* === HURUF N (putih, di dalam gerbang) === */}
        <path
          d="M34 70 L34 42 L40 42 L50 59 L60 42 L66 42 L66 70 L61 70 L61 51 L50 65 L39 51 L39 70 Z"
          fill="white"
        />

        {/* === TOPI WISUDA (atas) === */}
        {/* Board datar — diamond/rhombus */}
        <path d="M12 28 L50 16 L88 28 L50 38 Z" fill="#0d9488" />
        {/* Headpiece di bawah board */}
        <path
          d="M32 31 L32 38 Q32 44 50 46 Q68 44 68 38 L68 31 L50 36 Z"
          fill="#0a7d74"
        />
        {/* Tassel cord */}
        <path
          d="M88 28 Q93 30 93 36 L93 44"
          stroke="#0d9488"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tassel end knob */}
        <circle cx="93" cy="47" r="3.5" fill="#0d9488" />
        {/* Tassel fringe */}
        <path
          d="M90 50 Q93 54 96 50"
          stroke="#0d9488"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}
