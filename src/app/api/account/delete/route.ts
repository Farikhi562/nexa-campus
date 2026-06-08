import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isFounderEmail } from '@/lib/plans'

async function safeDelete(service: ReturnType<typeof createServiceClient>, table: string, column: string, userId: string) {
  try {
    await service.from(table).delete().eq(column, userId)
  } catch (error) {
    console.error(`[Delete Account] ${table}.${column}`, error)
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { confirmation?: unknown }
  try { body = await req.json() } catch { body = {} }
  if (String(body.confirmation ?? '').trim().toUpperCase() !== 'HAPUS AKUN') {
    return NextResponse.json({ error: 'Konfirmasi tidak valid. Ketik HAPUS AKUN.' }, { status: 400 })
  }

  if (isFounderEmail(user.email)) {
    return NextResponse.json({ error: 'Akun founder tidak bisa dihapus dari tombol publik. Bagus juga, masa pencipta NEXA kehapus gara-gara typo.' }, { status: 403 })
  }

  const service = createServiceClient()
  const userId = user.id

  // Hapus relasi yang paling sering punya FK dulu. Kalau ada tabel yang belum ada, errornya diabaikan.
  await safeDelete(service, 'private_messages', 'sender_id', userId)
  await safeDelete(service, 'private_messages', 'receiver_id', userId)
  await safeDelete(service, 'study_room_messages', 'sender_id', userId)
  await safeDelete(service, 'study_room_members', 'user_id', userId)
  await safeDelete(service, 'study_room_join_requests', 'user_id', userId)
  await safeDelete(service, 'friend_requests', 'requester_id', userId)
  await safeDelete(service, 'friend_requests', 'receiver_id', userId)
  await safeDelete(service, 'notifications', 'user_id', userId)
  await safeDelete(service, 'daily_checkins', 'user_id', userId)
  await safeDelete(service, 'points_events', 'user_id', userId)
  await safeDelete(service, 'academic_deadlines', 'user_id', userId)
  await safeDelete(service, 'reminder_preferences', 'user_id', userId)
  await safeDelete(service, 'nexa_arena_team_members', 'user_id', userId)
  await safeDelete(service, 'nexa_arena_applications', 'applicant_id', userId)
  await safeDelete(service, 'nexa_arena_posts', 'creator_id', userId)
  await safeDelete(service, 'referrals', 'referrer_id', userId)
  await safeDelete(service, 'referrals', 'referred_id', userId)
  await safeDelete(service, 'subscription_intents', 'user_id', userId)
  await safeDelete(service, 'profiles', 'id', userId)

  const { error } = await service.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: `Data dibersihkan, tapi Auth user gagal dihapus: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
