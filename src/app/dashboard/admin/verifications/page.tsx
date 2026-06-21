import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import VerificationReviewPanel from '@/components/admin/VerificationReviewPanel'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Server-side admin check (bukan cuma UI hiding) — pola sama dengan app/admin/page.tsx.
  if (!isAdminEmail(user.email)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-slate-950">Akses Ditolak</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Halaman ini hanya dapat diakses oleh email yang terdaftar sebagai admin.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800">
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950">
          <ShieldCheck className="h-6 w-6 text-blue-600" /> Review Verifikasi Akun
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Approve/reject permintaan centang biru &quot;Verified by NEXA&quot;. Verified bukan auto-approve —
          tetap cek profil, evidence, dan riwayat lamaran Arena sebelum menyetujui.
        </p>
      </div>
      <VerificationReviewPanel />
    </div>
  )
}
