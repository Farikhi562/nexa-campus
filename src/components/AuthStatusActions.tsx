'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AuthStatusActions({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const [isAuthed, setIsAuthed] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAuthed(Boolean(data.user)))
  }, [supabase])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (isAuthed) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className={`hidden text-sm font-bold sm:inline ${variant === 'dark' ? 'text-slate-200 hover:text-teal-100' : 'text-slate-600 hover:text-brand-700'}`}
        >
          Dashboard
        </Link>
        <button
          onClick={signOut}
          className={`focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${
            variant === 'dark'
              ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
              : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className={`text-sm font-bold ${variant === 'dark' ? 'text-slate-200 hover:text-teal-100' : 'text-slate-600 hover:text-brand-700'}`}
      >
        Login
      </Link>
      <Link
        href="/login?mode=signup"
        className={`rounded-lg px-3 py-2 text-sm font-bold ${
          variant === 'dark'
            ? 'bg-teal-400 text-slate-950 hover:bg-teal-300'
            : 'bg-brand-600 text-white hover:bg-brand-700'
        }`}
      >
        Mulai
      </Link>
    </div>
  )
}
