'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, Calendar, LayoutDashboard, LogOut, Menu, Settings, Sparkles, Store, Users, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import NexaLogo from './NexaLogo'
import { PlanBadge } from './ui/Badge'
import type { Profile } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/upload', icon: BookOpen,        label: 'Materi & Ujian' },
  { href: '/dashboard/tools', icon: Sparkles,         label: 'Campus Tools' },
  { href: '/study-room',       icon: Users,           label: 'Study Room' },
  { href: '/dashboard/marketplace', icon: Store,      label: 'Marketplace' },
  { href: '/dashboard/jadwal', icon: Calendar,        label: 'Smart Reminder' },
  { href: '/dashboard/settings', icon: Settings,      label: 'Pengaturan' },
]

export default function DashboardNav({ profile }: { profile: Profile }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-brand-950 text-white fixed left-0 top-0 z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <NexaLogo className="h-8 w-8 rounded-lg bg-white" />
            <div>
              <span className="block text-lg font-bold leading-5 tracking-tight">NEXA</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200">
                Campus
              </span>
            </div>
          </Link>
        </div>

        {/* User profile */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {(profile.full_name || profile.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile.full_name || 'Pengguna'}
              </p>
              <PlanBadge plan={profile.plan} className="mt-0.5" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-700 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-brand-950 text-white px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <NexaLogo className="h-7 w-7 rounded-lg bg-white" />
          <span className="font-bold">NEXA Campus</span>
        </Link>
        <button onClick={() => setMobileOpen(v => !v)} className="p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-brand-950/95 pt-16 px-4" onClick={() => setMobileOpen(false)}>
          <nav className="space-y-1 pt-4">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 text-sm font-medium"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-sm font-medium w-full"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
