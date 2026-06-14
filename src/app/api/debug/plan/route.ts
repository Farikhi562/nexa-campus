import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Belum login.' }, { status: 401 })
  }

  const access = await getUserPlanAccess({ supabase, user })

  return NextResponse.json({
    user,
    plan: access?.plan ?? null,
    ownerOverride: access?.ownerOverride ?? false,
    profile: access?.profile ?? null,
    note: 'Kalau plan command di sini, /dashboard/nexa-assistant harus kebuka. Kalau masih radar, cek profiles.id dan env NEXA_OWNER_EMAILS/ADMIN_EMAILS.',
  })
}
