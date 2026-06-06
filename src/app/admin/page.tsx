import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import AdminCommandCenter from '@/components/admin/AdminCommandCenter'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail, getAdminEmails } from '@/lib/admin'
import type { Profile, Referral, SubscriptionIntent } from '@/types'

export const dynamic = 'force-dynamic'

function getReadClient(fallback: Awaited<ReturnType<typeof createClient>>) {
  try { return createServiceClient() } catch { return fallback }
}

type StudyRoomRow = {
  id: string; title: string; status: string; current_members_count: number
  max_members: number; category: string; owner_id: string; created_at: string
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Server-side admin check (not just UI hiding)
  if (!isAdminEmail(user.email)) {
    // Show clear 403, don't just redirect silently
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-slate-950">Akses Ditolak</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Halaman admin hanya dapat diakses oleh email yang terdaftar sebagai admin.
            Kamu login sebagai <span className="font-bold">{user.email}</span>.
          </p>
          <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800">
            Kembali ke Dashboard
          </Link>
        </div>
      </main>
    )
  }

  const db = getReadClient(supabase)

  const [
    { data: profiles },
    { data: intents },
    { data: referrals },
    { data: studyRooms },
    { data: friendRequests },
  ] = await Promise.all([
    db.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('subscription_intents').select('*').order('created_at', { ascending: false }).limit(50),
    db.from('referrals').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('study_rooms').select('*').order('created_at', { ascending: false }).limit(50),
    db.from('friend_requests').select('*').order('created_at', { ascending: false }).limit(100),
  ])

  const typedProfiles = (Array.isArray(profiles) ? profiles : []) as Profile[]
  const typedIntents = (Array.isArray(intents) ? intents : []) as SubscriptionIntent[]
  const typedReferrals = (Array.isArray(referrals) ? referrals : []) as Referral[]
  const typedRooms = (Array.isArray(studyRooms) ? studyRooms : []) as StudyRoomRow[]
  const typedFriendRequests = (Array.isArray(friendRequests) ? friendRequests : []) as Array<{id:string;requester_id:string;receiver_id:string;status:string;created_at:string}>

  // Safe name map (no sensitive data to non-admin routes)
  const nameById: Record<string, string> = {}
  for (const p of typedProfiles) {
    nameById[p.id] = p.full_name || p.email || p.id.slice(0, 8)
  }
  // Fill missing IDs from referrals/rooms
  const missingIds = Array.from(new Set([
    ...typedReferrals.flatMap((r) => [r.referrer_id, r.referred_id]),
    ...typedRooms.map((r) => r.owner_id),
    ...typedFriendRequests.flatMap((r) => [r.requester_id, r.receiver_id]),
  ].filter((id) => id && !nameById[id])))
  if (missingIds.length > 0) {
    const { data: extra } = await db.from('profiles').select('id, full_name, email').in('id', missingIds)
    for (const p of (extra ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
      nameById[p.id] = p.full_name || p.email || p.id.slice(0, 8)
    }
  }

  // System health: cek presence env — JANGAN tampilkan nilai, hanya configured/not
  const systemHealth = [
    { label: 'Supabase URL', key: 'NEXT_PUBLIC_SUPABASE_URL', configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL, note: 'Required for database connection' },
    { label: 'Supabase Anon Key', key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, note: 'Required for client auth' },
    { label: 'Supabase Service Role Key', key: 'SUPABASE_SERVICE_ROLE_KEY', configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY, note: 'Required for admin operations & referral rewards' },
    { label: 'Gemini API Key', key: 'GEMINI_API_KEY', configured: !!process.env.GEMINI_API_KEY, note: 'Needed for AI Quick Add & Tanya NEXA' },
    { label: 'Admin Emails (env)', key: 'ADMIN_EMAILS', configured: !!process.env.ADMIN_EMAILS, note: `Fallback aktif: ${getAdminEmails().join(', ')}` },
    { label: 'Midtrans Server Key', key: 'MIDTRANS_SERVER_KEY', configured: !!process.env.MIDTRANS_SERVER_KEY, note: 'Needed for auto payment processing' },
    { label: 'Midtrans Client Key (public)', key: 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY', configured: !!process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY, note: 'Needed for Snap.js payment UI' },
    { label: 'Site URL', key: 'NEXT_PUBLIC_SITE_URL', configured: !!process.env.NEXT_PUBLIC_SITE_URL, note: 'Used for SEO & payment callback URL' },
  ]

  const stats = {
    totalUsers: typedProfiles.length,
    pendingIntents: typedIntents.filter((i) => i.status === 'pending').length,
    rewardedReferrals: typedReferrals.filter((r) => r.rewarded).length,
    commandUsers: typedProfiles.filter((p) => p.plan === 'command').length,
    activeRooms: typedRooms.filter((r) => r.status === 'open').length,
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      {/* Header */}
      <section className="border-b border-slate-900 bg-slate-950 text-white">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.26),transparent_24rem)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Command Center
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                NEXA Admin Dashboard.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Login sebagai <span className="font-bold text-teal-200">{user.email}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black text-white hover:bg-white/15">
                Dashboard
              </Link>
              <Link href="/admin/readiness" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-teal-300">
                Readiness
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-5">
        <AdminCommandCenter
          profiles={typedProfiles}
          intents={typedIntents}
          referrals={typedReferrals}
          studyRooms={typedRooms}
          friendRequests={typedFriendRequests}
          nameById={nameById}
          systemHealth={systemHealth}
          stats={stats}
        />
      </div>
    </main>
  )
}
