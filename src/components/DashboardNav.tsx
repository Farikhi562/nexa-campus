'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, Calendar, Home, LayoutDashboard, LogOut, MoreVertical, Settings, Sparkles, Store, Trophy, UserRound, Users, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import NexaLogo from './NexaLogo'
import { PlanBadge } from './ui/Badge'
import NotificationBell from './NotificationBell'
import type { Profile } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/upload', icon: BookOpen,        label: 'Materi & Ujian' },
  { href: '/dashboard/tools', icon: Sparkles,         label: 'Campus Tools' },
  { href: '/study-room',       icon: Users,           label: 'Study Room' },
  { href: '/tim',              icon: Users,           label: 'Tim Belajar' },
  { href: '/dashboard/marketplace', icon: Store,      label: 'Marketplace' },
  { href: '/jadwal', icon: Calendar,        label: 'Jadwal Ujian' },
  { href: '/leaderboard', icon: Trophy,        label: 'Leaderboard' },
  { href: '/dashboard/settings', icon: Settings,      label: 'Pengaturan' },
]

export default function DashboardNav({ profile }: { profile: Profile }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const initials = (profile.full_name || profile.email || 'U').charAt(0).toUpperCase()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-950 text-white fixed left-0 top-0 z-30">
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#A78BFA] flex items-center justify-center text-sm font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {profile.full_name || 'Pengguna'}
              </p>
              <PlanBadge plan={profile.plan} className="mt-0.5" />
            </div>
            <NotificationBell />
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
                    ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10'
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-slate-950/95 px-4 py-3 text-white backdrop-blur-xl">
        <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <NexaLogo className="h-7 w-7 rounded-lg bg-white" />
          <span className="font-bold">NEXA Campus Ecosystem</span>
        </Link>
        <div className="flex items-center gap-1">
        <NotificationBell />
        <button
          type="button"
          onClick={() => setProfileOpen((value) => !value)}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 py-1 pl-1 pr-2 text-left backdrop-blur transition hover:bg-white/15"
          aria-expanded={profileOpen}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4F8EF7] to-[#A78BFA] text-xs font-black">
            {initials}
          </span>
          <MoreVertical className="h-4 w-4 text-white/70" />
        </button>
        </div>
        </div>

        {profileOpen && (
          <div className="absolute right-4 top-14 w-72 rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{profile.full_name || 'Pengguna NEXA'}</p>
                <p className="mt-1 truncate text-xs text-white/55">{profile.email}</p>
                <PlanBadge plan={profile.plan} className="mt-2" />
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Tutup menu profil"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                <UserRound className="h-4 w-4" />
                Profil
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Pengaturan
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        )}
      </header>

      <nav className="fixed bottom-3 left-3 right-3 z-30 grid grid-cols-5 rounded-3xl border border-white/10 bg-slate-950/92 p-2 text-white shadow-2xl shadow-slate-950/35 backdrop-blur-xl lg:hidden">
        {[
          { href: '/dashboard', icon: Home, label: 'Home' },
          { href: '/dashboard/upload', icon: BookOpen, label: 'Exam' },
          { href: '/jadwal', icon: Calendar, label: 'Jadwal' },
          { href: '/dashboard/marketplace', icon: Store, label: 'Market' },
          { href: '/dashboard/profile', icon: UserRound, label: 'Profil' },
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-bold transition ${
                active ? 'bg-gradient-to-br from-[#4F8EF7] to-[#A78BFA] text-white shadow-lg shadow-blue-500/25' : 'text-white/55 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
