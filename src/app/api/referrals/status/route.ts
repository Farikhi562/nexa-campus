import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/referrals/status — cek apakah user sudah pernah direferral dan status reward-nya */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  // Referral yang user TERIMA (mereka adalah referred_id)
  const { data: incoming } = await supabase
    .from('referrals')
    .select('id, rewarded, created_at, referrer_id')
    .eq('referred_id', user.id)
    .maybeSingle()

  // Referral yang user KIRIM (mereka adalah referrer_id)
  const { data: sent, count: sentCount } = await supabase
    .from('referrals')
    .select('id, rewarded, created_at, referred_id', { count: 'exact' })
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    referred_by: incoming ?? null,
    sent_referrals: sent ?? [],
    sent_count: sentCount ?? 0,
    rewarded_count: (sent ?? []).filter((r: { rewarded: boolean }) => r.rewarded).length,
  })
}
