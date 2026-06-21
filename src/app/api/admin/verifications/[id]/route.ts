import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'

type Params = { params: Promise<{ id: string }> }

function text(value: unknown, max = 1000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const action = body.action === 'verify' ? 'verify' : body.action === 'reject' ? 'reject' : null
  if (!action) return NextResponse.json({ error: 'Action harus "verify" atau "reject".' }, { status: 400 })

  const db = createServiceClient()

  const { data: row, error: rowError } = await db
    .from('user_verifications')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle()

  if (rowError) return NextResponse.json({ error: rowError.message }, { status: 500 })
  if (!row) return NextResponse.json({ error: 'Permintaan verifikasi tidak ditemukan.' }, { status: 404 })

  const verification = row as { id: string; user_id: string; status: string }
  const newStatus = action === 'verify' ? 'verified' : 'rejected'

  const { data, error } = await db
    .from('user_verifications')
    .update({
      status: newStatus,
      reviewed_by: user.id,
      review_notes: text(body.review_notes) || null,
      verified_at: action === 'verify' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sinkron flag denormalisasi di profiles (dipakai FounderVerifiedBadge dkk
  // supaya tidak perlu join ke user_verifications di setiap render badge).
  const { error: profileError } = await db
    .from('profiles')
    .update({ is_nexa_verified: action === 'verify' })
    .eq('id', verification.user_id)

  if (profileError) {
    console.error('[admin/verifications] gagal sync is_nexa_verified:', profileError.message)
  }

  await db.from('notifications').insert({
    user_id: verification.user_id,
    type: action === 'verify' ? 'verification_approved' : 'verification_rejected',
    title: action === 'verify' ? 'Akun kamu terverifikasi!' : 'Verifikasi belum disetujui',
    message: action === 'verify'
      ? 'Centang biru "Verified by NEXA" sekarang aktif di profilmu.'
      : text(body.review_notes) || 'Lengkapi lagi data profil/evidence kamu, lalu ajukan ulang.',
    link: '/dashboard/settings/profile',
    is_read: false,
  }).then(undefined, () => null)

  return NextResponse.json({ data })
}
