import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import NexaCampusLogo from '@/components/brand/NexaCampusLogo'
import Badge from '@/components/ui/Badge'
import { BRAND } from '@/lib/brand'

type PublicPageShellProps = {
  badge: string
  title: string
  description: string
  children: React.ReactNode
  primaryCta?: {
    label: string
    href: string
  }
  secondaryCta?: {
    label: string
    href: string
  }
}

export default function PublicPageShell({
  badge,
  title,
  description,
  children,
  primaryCta = { label: 'Mulai Gratis', href: '/login?mode=signup' },
  secondaryCta,
}: PublicPageShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="min-w-0">
            <NexaCampusLogo tone="dark" imageClassName="h-10 w-10" />
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-black text-slate-300 md:flex">
            <Link href="/pricing" className="hover:text-teal-200">Pricing</Link>
            <Link href="/privacy" className="hover:text-teal-200">Privacy</Link>
            <Link href="/support" className="hover:text-teal-200">Support</Link>
            <Link href="/release-notes" className="hover:text-teal-200">v{BRAND.version}</Link>
          </nav>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-teal-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-teal-300"
          >
            Masuk
          </Link>
        </div>
      </header>

      <section className="border-b border-slate-900 bg-slate-950 text-white">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.25),transparent_24rem),radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.13),transparent_22rem)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-35" />
          <div className="relative max-w-4xl">
            <Badge tone="brand" className="mb-5 bg-teal-300/10 text-teal-100 ring-teal-300/20">
              {badge}
            </Badge>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryCta.href}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300"
              >
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
            <div className="mt-6 flex max-w-2xl gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-xs leading-5 text-slate-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-200" />
              <p>{BRAND.disclaimer}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {children}
      </section>
    </main>
  )
}
