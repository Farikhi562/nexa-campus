import { cn } from '@/lib/utils'

export default function NexaLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(135deg,#14b8a6,#0f766e_48%,#0f172a)] text-sm font-black tracking-tight text-white shadow-lg shadow-teal-950/25',
        className
      )}
      aria-label="NEXA Campus"
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.55),transparent_22%),radial-gradient(circle_at_82%_72%,rgba(45,212,191,0.35),transparent_30%)]" />
      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-100 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />
      <span className="relative">NX</span>
    </div>
  )
}
