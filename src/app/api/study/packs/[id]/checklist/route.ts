import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checklistFromRoadmap, validateChecklist } from '@/lib/study/plan'

export const runtime = 'nodejs'
export const maxDuration = 10

type RouteContext = { params: Promise<{ id: string }> }

// ─── GET /api/study/packs/[id]/checklist ─────────────────────────────────────
// Ambil checklist pack. Kalau belum ada, generate default dari roadmap.

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id: packId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: pack, error } = await supabase
    .from('study_packs')
    .select('id, checklist, roadmap')
    .eq('id', packId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[api/checklist GET]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  const saved = Array.isArray(pack.checklist) && pack.checklist.length > 0
    ? pack.checklist
    : null

  if (saved) {
    return NextResponse.json({ items: saved, generated: false })
  }

  // Generate default dari roadmap (tidak disimpan otomatis ke DB — user harus PATCH dulu)
  const items = checklistFromRoadmap(pack.roadmap)
  return NextResponse.json({ items, generated: true })
}

// ─── PATCH /api/study/packs/[id]/checklist ───────────────────────────────────
// Simpan keseluruhan array checklist (replace, bukan merge).

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id: packId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: { items?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const items = validateChecklist(body.items)
  if (!items) {
    return NextResponse.json({ error: 'Format checklist tidak valid (maks 50 item, field id/text/done/order wajib).' }, { status: 400 })
  }

  // Pastikan pack milik user
  const { data: pack } = await supabase
    .from('study_packs')
    .select('id')
    .eq('id', packId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  const { error: updateErr } = await supabase
    .from('study_packs')
    .update({ checklist: items })
    .eq('id', packId)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('[api/checklist PATCH]', updateErr.message)
    return NextResponse.json({ error: 'Gagal menyimpan checklist.' }, { status: 500 })
  }

  return NextResponse.json({ items })
}
