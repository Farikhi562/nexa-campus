'use client'

import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function BannedScreen({ reason }: { reason: string | null }) {
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5ef] p-6">
      <div className="max-w-md rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03] backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-slate-950">Akun Dinonaktifkan</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{reason || 'Akun kamu dinonaktifkan karena melanggar ketentuan penggunaan NEXA Campus.'}</p>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Kalau menurutmu ini keliru, hubungi tim NEXA lewat kontak yang tersedia di landing page.
        </p>
        <button
          onClick={signOut}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
        >
          Keluar
        </button>
      </div>
    </main>
  )
}
