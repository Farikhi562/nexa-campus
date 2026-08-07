import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

const VALID_REASONS = ['spam', 'pelecehan', 'penipuan', 'konten_tidak_pantas', 'akun_palsu', 'lainnya']

function text(value: unknown, max = 1000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

/** POST /api/reports — user melaporkan akun lain. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const rl = await checkRateLimit(supabase, 'report-account', 10, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const reportedUserId = text(body.reported_user_id, 100)
  const reason = text(body.reason, 50)
  const detail = text(body.detail, 1000) || null

  if (!reportedUserId) return NextResponse.json({ error: 'reported_user_id wajib diisi.' }, { status: 400 })
  if (reportedUserId === user.id) return NextResponse.json({ error: 'Nggak bisa melaporkan akun sendiri.' }, { status: 400 })
  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Pilih alasan laporan yang valid.' }, { status: 400 })
  }

  const { data: target } = await supabase.from('profiles').select('id').eq('id', reportedUserId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Akun yang dilaporkan tidak ditemukan.' }, { status: 404 })

  const { error } = await supabase.from('user_reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason,
    detail,
  })

  if (error) {
    // Unique index user_reports_one_pending_per_target -> user sudah pernah lapor akun ini & masih pending.
    if (error.message.toLowerCase().includes('duplicate') || error.code === '23505') {
      return NextResponse.json({ error: 'Kamu sudah melaporkan akun ini sebelumnya. Laporan masih diproses tim kami.' }, { status: 409 })
    }
    console.error('[api/reports]', error.message)
    return NextResponse.json({ error: 'Gagal mengirim laporan. Coba lagi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Laporan terkirim. Tim NEXA akan meninjau akun ini.' })
}
