import NexaLogo from './NexaLogo'
import Link from 'next/link'

export default function PoweredByFooter({ className = '' }: { className?: string }) {
  return (
    <footer className={`border-t border-slate-200 bg-white px-4 py-6 ${className}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <NexaLogo className="h-7 w-7 rounded-md bg-slate-50" />
          <span className="font-black text-slate-950">NEXA Campus Ecosystem</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-semibold text-slate-600">
          <Link href="/faq" className="hover:text-brand-700">FAQ v1.0</Link>
          <Link href="/legal/privacy" className="hover:text-brand-700">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-brand-700">Terms</Link>
          <p>Powered by NEXA Tech Labs</p>
        </div>
      </div>
    </footer>
  )
}
