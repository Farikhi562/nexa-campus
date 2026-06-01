'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AuthStatusActions() {
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
        <Link href="/dashboard" className="hidden text-sm font-bold text-slate-600 hover:text-brand-700 sm:inline">
          Dashboard
        </Link>
        <button
          onClick={signOut}
          className="focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-brand-700">
        Login
      </Link>
      <Link
        href="/login?mode=signup"
        className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700"
      >
        Daftar
      </Link>
    </div>
  )
}
