import BillingIntentForm from '@/components/BillingIntentForm'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { Profile, SubscriptionIntent } from '@/types'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: profile }, { data: intents }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('subscription_intents').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
  ])

  const typedProfile = profile as Profile

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">Manual dulu. Tidak ada auto-upgrade sebelum admin confirm.</p>
      </div>
      <Card>
        <CardContent>
          <Badge tone="brand" className="mb-3">Plan aktif: {PLAN_LABELS[typedProfile.plan]}</Badge>
          <BillingIntentForm profile={typedProfile} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="font-black text-slate-950">Riwayat intent</h2>
          <div className="mt-4 space-y-2">
            {((intents ?? []) as SubscriptionIntent[]).length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada intent upgrade.</p>
            ) : (
              ((intents ?? []) as SubscriptionIntent[]).map((intent) => (
                <div key={intent.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="font-bold text-slate-700">{PLAN_LABELS[intent.requested_plan]}</span>
                  <Badge tone={intent.status === 'confirmed' ? 'success' : 'warning'}>{intent.status}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
