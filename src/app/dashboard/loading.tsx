import { Card, CardContent } from '@/components/ui/Card'

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-900" />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item}>
            <CardContent className="p-4">
              <div className="h-8 w-14 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100" />
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 space-y-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
