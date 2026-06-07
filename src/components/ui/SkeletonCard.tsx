import { Card, CardContent } from '@/components/ui/Card'

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim =
    size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-7 w-7' : 'h-11 w-11'
  return (
    <div className={`${dim} flex-shrink-0 animate-pulse rounded-2xl bg-slate-200`} />
  )
}

export function SkeletonCard({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4 sm:p-5">
        <SkeletonLine className="h-5 w-2/5 mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonLine
            key={i}
            className={`h-4 mb-3 ${i === rows - 1 ? 'w-3/5' : 'w-full'}`}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function SkeletonLeaderboardEntry() {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4">
      <SkeletonLine className="h-5 w-6" />
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-3 w-20" />
      </div>
      <SkeletonLine className="h-5 w-12" />
    </div>
  )
}

export function SkeletonPodium() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="flex flex-col items-center p-3 sm:p-4">
            <SkeletonAvatar size="lg" />
            <SkeletonLine className="mt-3 h-4 w-16" />
            <SkeletonLine className="mt-2 h-3 w-12" />
            <SkeletonLine className="mt-3 h-6 w-10" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function SkeletonDeadlineCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-3 w-1/2" />
          <SkeletonLine className="h-3 w-2/5" />
        </div>
        <SkeletonLine className="h-7 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonAchievementCard() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-3 w-full" />
            <SkeletonLine className="h-3 w-3/4" />
          </div>
        </div>
        <SkeletonLine className="mt-3 h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  )
}

export default SkeletonCard
