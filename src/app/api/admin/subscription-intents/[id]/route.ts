import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'
import type { Plan, SubscriptionIntentStatus } from '@/types'

// CATATAN: sebelumnya file ini punya getAdminEmails()/requireAdmin() sendiri
// yang HANYA membaca process.env.ADMIN_EMAILS tanpa fallback — berbeda dari
// lib/admin.ts yang dipakai halaman /admin (yang punya fallback admin email).
// Bukan celah keamanan (fail-closed kalau env kosong), tapi inkonsisten dan
// rawan membingungkan saat maintenance. Disatukan ke lib/admin.ts.
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { user, isAdmin: isAdminEmail(user?.email) }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { isAdmin } = await requireAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized admin action.' }, { status: 401 })
  }

  let body: { action?: unknown }
  try {
    body = (await request.json()) as { action?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : ''
  if (action !== 'confirm' && action !== 'reject') {
    return NextResponse.json({ error: 'Action tidak valid.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: intent, error: intentError } = await service
    .from('subscription_intents')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (intentError) {
    return NextResponse.json({ error: 'Intent gagal dicek.' }, { status: 500 })
  }

  if (!intent) {
    return NextResponse.json({ error: 'Intent tidak ditemukan.' }, { status: 404 })
  }

  const status: SubscriptionIntentStatus = action === 'confirm' ? 'confirmed' : 'rejected'

  if (action === 'confirm') {
    const requestedPlan = intent.requested_plan as Exclude<Plan, 'radar'>
    const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error: profileError } = await service
      .from('profiles')
      .update({
        plan: requestedPlan,
        plan_expires_at: planExpiresAt,
        subscription_expires_at: planExpiresAt,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', intent.user_id)

    if (profileError) {
      return NextResponse.json({ error: 'Plan user gagal diupdate.' }, { status: 500 })
    }
  }

  const { data, error } = await service
    .from('subscription_intents')
    .update({ status })
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Status intent gagal diupdate.' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
