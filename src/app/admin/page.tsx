import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, CreditCard, ShieldCheck, UsersRound } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import SubscriptionIntentActions from '@/components/admin/SubscriptionIntentActions'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { Profile, Referral, SubscriptionIntent } from '@/types'

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function getPlanLabel(plan: Profile['plan']) {
  return PLAN_LABELS[plan] ?? 'NEXA Radar'
}

function statusTone(status: SubscriptionIntent['status']) {
  if (status === 'confirmed') return 'success'
  if (status === 'rejected' || status === 'cancelled') return 'danger'
  return 'warning'
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmails = getAdminEmails()
  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect('/dashboard')
  }

  const [{ data: profiles }, { data: intents }, { data: referrals }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('subscription_intents').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('referrals').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  const typedProfiles = (Array.isArray(profiles) ? profiles : []) as Profile[]
  const typedIntents = (Array.isArray(intents) ? intents : []) as SubscriptionIntent[]
  const typedReferrals = (Array.isArray(referrals) ? referrals : []) as Referral[]

  const pendingIntents = typedIntents.filter((intent) => intent.status === 'pending').length
  const confirmedReferrals = typedReferrals.filter((referral) => referral.rewarded).length
  const commandUsers = typedProfiles.filter((profile) => profile.plan === 'command').length

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <section className="border-b border-slate-900 bg-slate-950 text-white">
        <div className="relative mx-auto max-w-7xl overflow-hidden px-4 py-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.26),transparent_24rem)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Beta Command Center
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
                Operasional NEXA Campus, rapi dalam satu radar.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Pantau beta users, request upgrade manual, dan referral reward tanpa klaim palsu. Ini panel kerja, bukan pajangan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white hover:bg-white/15">
                Dashboard
              </Link>
              <Link href="/admin/readiness" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-teal-300">
                Readiness
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:py-6">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Beta users', value: typedProfiles.length, icon: UsersRound, copy: '20 user terbaru' },
            { label: 'Pending upgrades', value: pendingIntents, icon: CreditCard, copy: 'Butuh follow-up admin' },
            { label: 'Rewarded referrals', value: confirmedReferrals, icon: CheckCircle2, copy: 'Referral yang sudah reward' },
            { label: 'Command users', value: commandUsers, icon: ShieldCheck, copy: 'User paket tertinggi' },
          ].map(({ label, value, icon: Icon, copy }) => (
            <Card key={label} className="overflow-hidden border-slate-200 bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
                    <p className="mt-1 text-sm font-black text-slate-800">{label}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{copy}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-teal-200">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-0">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <h2 className="text-lg font-black text-slate-950">Beta users terbaru</h2>
                <p className="mt-1 text-sm text-slate-500">Scan cepat siapa yang sudah masuk ekosistem beta.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {typedProfiles.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">Belum ada beta user yang kebaca.</p>
                ) : typedProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between gap-3 p-4 transition hover:bg-slate-50 sm:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                        {profile.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (profile.full_name || profile.email || 'N').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{profile.full_name || profile.email}</p>
                        <p className="truncate text-xs text-slate-500">{profile.campus_name || 'Kampus belum diisi'}</p>
                      </div>
                    </div>
                    <Badge tone={profile.plan === 'command' ? 'brand' : profile.plan === 'pulse' ? 'info' : 'neutral'}>
                      {getPlanLabel(profile.plan)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-0">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <h2 className="text-lg font-black text-slate-950">Upgrade intent terbaru</h2>
                <p className="mt-1 text-sm text-slate-500">Confirm manual setelah pembayaran benar-benar dicek.</p>
              </div>
              <div className="divide-y divide-slate-100">
                {typedIntents.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">Belum ada intent upgrade.</p>
                ) : typedIntents.map((intent) => (
                  <div key={intent.id} className="p-4 transition hover:bg-slate-50 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {PLAN_LABELS[intent.requested_plan] ?? intent.requested_plan}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{intent.payment_method}</p>
                      </div>
                      <Badge tone={statusTone(intent.status)}>{intent.status}</Badge>
                    </div>
                    <SubscriptionIntentActions
                      intentId={intent.id}
                      disabled={intent.status !== 'pending'}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
