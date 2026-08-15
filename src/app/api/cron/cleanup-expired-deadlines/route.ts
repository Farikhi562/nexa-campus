import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron: hapus otomatis deadline yang tanggalnya sudah lewat, HANYA untuk user
 * yang mengaktifkan opsi ini sendiri di Settings → Reminder
 * (profiles.auto_delete_expired_deadlines) dan sesuai jumlah hari toleransi
 * yang mereka pilih (profiles.auto_delete_expired_after_days, 0–60 hari).
 *
 * Default fitur ini OFF untuk semua user — supaya nggak ada yang kehilangan
 * data deadline tanpa sadar/tanpa consent.
 *
 * Jadwal disarankan: sekali sehari (lihat vercel.json).
 */

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) return true
  if (process.env.NODE_ENV === 'development') return true
  return false
}

function jakartaDateStr(): string {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 10)
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const db = createServiceClient()
  const today = jakartaDateStr()

  const { data: users, error } = await db
    .from('profiles')
    .select('id, auto_delete_expired_after_days')
    .eq('auto_delete_expired_deadlines', true)

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil daftar user.' }, { status: 500 })
  }

  if (!users?.length) {
    return NextResponse.json({ ok: true, date: today, users_checked: 0, deleted: 0 })
  }

  // Kelompokkan user berdasarkan jumlah hari toleransi yang sama, supaya
  // penghapusan bisa dilakukan per-batch (bukan query 1-per-1 per user).
  const byDays = new Map<number, string[]>()
  for (const u of users as Array<{ id: string; auto_delete_expired_after_days: number }>) {
    const days = u.auto_delete_expired_after_days ?? 7
    const list = byDays.get(days) ?? []
    list.push(u.id)
    byDays.set(days, list)
  }

  let deleted = 0
  const errors: string[] = []

  for (const [days, userIds] of Array.from(byDays.entries())) {
    const cutoff = subtractDays(today, days)

    // "Sudah lewat" = deadline_date < cutoff. Toleransi (days) dihitung dari
    // tanggal deadline itu sendiri, bukan dari kapan cron ini jalan — jadi
    // kalau user pilih "hapus setelah 3 hari", deadline yang lewat 2 hari
    // masih aman, yang lewat 4 hari baru kehapus.
    const { error: delErr, count } = await db
      .from('academic_deadlines')
      .delete({ count: 'exact' })
      .in('user_id', userIds)
      .lt('deadline_date', cutoff)

    if (delErr) {
      errors.push(`days=${days}: ${delErr.message}`)
      continue
    }
    deleted += count ?? 0
  }

  return NextResponse.json({
    ok: errors.length === 0,
    date: today,
    users_checked: users.length,
    deleted,
    errors: errors.length ? errors : undefined,
  })
}
