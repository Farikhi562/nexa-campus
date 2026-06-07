'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Award, Globe, LogOut, Settings, Trophy, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LANG_LABELS, useT, type Lang } from '@/components/LanguageProvider'

function initials(name?: string | null) {
  if (!name) return 'N'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'N'
}

export default function AvatarMenu({
  avatarUrl,
  fullName,
  email,
  nexaId,
}: {
  avatarUrl?: string | null
  fullName?: string | null
  email?: string | null
  nexaId?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { lang, setLang: setAppLang, t } = useT()

  useEffect(() => {
    if (!open) { setShowLang(false); return }
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowLang(false)
      }
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(false); setShowLang(false) } }
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

  function changeLang(l: Lang) {
    setAppLang(l)
    setShowLang(false)
  }

  const navItems = [
    { label: t('view_profile'), href: '/dashboard/settings/profile', icon: UserRound },
    { label: t('nav_leaderboard'), href: '/dashboard/leaderboard', icon: Trophy },
    { label: t('nav_achievements'), href: '/dashboard/achievements', icon: Award },
    { label: t('nav_settings'), href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Menu akun"
        className="focus-ring flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:ring-teal-300 sm:h-10 sm:w-10"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Foto profil" className="h-full w-full object-cover" />
        ) : initials(fullName)}
      </button>

      {open && (
        <div
          role="menu"
          // Penting: right-0 + max-w agar tidak overflow layar kecil
          className="absolute right-0 z-[90] mt-2 w-64 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15"
        >
          {/* User info */}
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-200 text-sm font-black text-slate-700">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : initials(fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{fullName || 'Mahasiswa NEXA'}</p>
              {nexaId && <p className="text-[11px] font-bold text-teal-600">#{nexaId}</p>}
              {email && <p className="truncate text-[11px] text-slate-500">{email}</p>}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Nav items */}
          <div className="p-1">
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </div>

          <div className="h-px bg-slate-100" />

          {/* Language switcher */}
          <div className="p-1">
            <button
              onClick={() => setShowLang(v => !v)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Globe className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span className="flex-1 text-left">{t('language')}</span>
              <span className="text-xs text-slate-400">{lang.toUpperCase()}</span>
            </button>
            {showLang && (
              <div className="mx-1 mb-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => changeLang(code)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-bold transition hover:bg-white ${
                      lang === code ? 'text-teal-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="w-4 text-center">{lang === code ? '✓' : ''}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          {/* Logout */}
          <div className="p-1">
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
