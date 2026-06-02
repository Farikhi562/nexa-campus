export default function EditDeadlineLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="h-36 animate-pulse rounded-3xl bg-slate-900" />
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
