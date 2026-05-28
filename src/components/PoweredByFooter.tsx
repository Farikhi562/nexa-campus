import NexaLogo from './NexaLogo'

export default function PoweredByFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`border-t border-slate-200 bg-white px-4 py-6 ${className}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <NexaLogo className="h-7 w-7 rounded-md bg-slate-50" />
          <span className="font-black text-slate-950">NEXA Campus Ecosystem</span>
        </div>
        <p className="font-semibold text-slate-600">Powered by NEXA Tech Labs</p>
      </div>
    </footer>
  )
}
