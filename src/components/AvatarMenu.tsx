'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Award, LogOut, Settings, Trophy, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function initials(name?: string | null) {
  if (!name) return 'N'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'N'
}

export default function AvatarMenu({
  avatarUrl,
  fullName,
  email,
}: {
  avatarUrl?: string | null
  fullName?: string | null
  email?: string | null
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const items = [
    { label: 'Lihat Profil', href: '/dashboard/settings/profile', icon: UserRound },
    { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
    { label: 'Pencapaian', href: '/dashboard/achievements', icon: Award },
    { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu akun"
        className="focus-ring flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:ring-brand-300 sm:h-10 sm:w-10"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
        ) : (
          initials(fullName)
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/10"
        >
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-black text-slate-700">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(fullName)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{fullName || 'Mahasiswa NEXA'}</p>
              {email && <p className="truncate text-xs text-slate-500">{email}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          {items.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 text-slate-500" />
              {label}
            </Link>
          ))}
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
