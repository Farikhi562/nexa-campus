import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CreditCard, UsersRound } from 'lucide-react'
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

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-700">Admin Beta</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Operasional NEXA Campus</h1>
            <p className="mt-2 text-sm text-slate-500">Panel ringkas untuk cek beta users, upgrade intent, dan referral.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
              Dashboard
            </Link>
            <Link href="/admin/readiness" className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700">
              Readiness
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent>
              <UsersRound className="mb-4 h-5 w-5 text-brand-700" />
              <p className="text-3xl font-black text-slate-950">{typedProfiles.length}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Latest beta users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <CreditCard className="mb-4 h-5 w-5 text-brand-700" />
              <p className="text-3xl font-black text-slate-950">{pendingIntents}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Pending upgrade intent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <CheckCircle2 className="mb-4 h-5 w-5 text-brand-700" />
              <p className="text-3xl font-black text-slate-950">{confirmedReferrals}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">Rewarded referrals</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="text-lg font-black text-slate-950">Beta users terbaru</h2>
              <div className="mt-4 space-y-2">
                {typedProfiles.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada beta user yang kebaca.</p>
                ) : typedProfiles.map((profile) => (
                  <div key={profile.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">{profile.full_name || profile.email}</p>
                        <p className="truncate text-xs text-slate-500">{profile.campus_name || 'Kampus belum diisi'}</p>
                      </div>
                      <Badge tone="brand">{PLAN_LABELS[profile.plan] ?? 'NEXA Radar'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h2 className="text-lg font-black text-slate-950">Upgrade intent terbaru</h2>
              <div className="mt-4 space-y-2">
                {typedIntents.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada intent upgrade.</p>
                ) : (
                  typedIntents.map((intent) => (
                    <div key={intent.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-slate-950">{PLAN_LABELS[intent.requested_plan] ?? intent.requested_plan}</p>
                        <Badge tone={intent.status === 'confirmed' ? 'success' : 'warning'}>{intent.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{intent.payment_method}</p>
                      <SubscriptionIntentActions
                        intentId={intent.id}
                        disabled={intent.status !== 'pending'}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
