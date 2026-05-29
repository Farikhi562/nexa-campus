import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type WeeklyProfile = {
  id: string
  full_name: string | null
  telegram_chat_id: string
  weakness_analysis?: { weakTopics?: string[] } | null
}

type WeeklySession = {
  score: number | null
  completed_at: string | null
}

function formatReport(profile: WeeklyProfile, stats: { streak: number; exams: number; avgScore: number; diff: number; weak: string[]; rank: number; total: number }) {
  return [
    'Laporan Minggu Ini - NEXA Campus',
    '',
    `Halo ${profile.full_name || 'Mahasiswa'}! Ini ringkasan belajarmu minggu ini:`,
    '',
    `Streak: ${stats.streak} hari`,
    `Exam selesai: ${stats.exams}`,
    `Rata-rata skor: ${stats.avgScore}/100`,
    `vs minggu lalu: ${stats.diff >= 0 ? '+' : ''}${stats.diff} poin`,
    '',
    'Perlu diperhatikan:',
    ...(stats.weak.length ? stats.weak.map((item) => `- ${item}`) : ['- Belum ada pola kelemahan baru.']),
    '',
    `Ranking kampus: #${stats.rank} dari ${stats.total} mahasiswa`,
    '',
    'Semangat minggu depan!',
    'campus.nexatechlabs.my.id',
  ].join('\n')
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const service = createServiceClient()
    const { data: profiles } = await service
      .from('profiles')
      .select('id, full_name, telegram_chat_id, weakness_analysis, plan, seat_owner_id')
      .or('plan.eq.pro,plan.eq.admin,seat_owner_id.not.is.null')
      .not('telegram_chat_id', 'is', null)

    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN belum diisi.' }, { status: 500 })

    const now = new Date()
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    let sent = 0

    for (const profile of (profiles || []) as WeeklyProfile[]) {
      const { data: sessions } = await service
        .from('exam_sessions')
        .select('score, completed_at')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .gte('completed_at', weekStart)

      const scores = ((sessions || []) as WeeklySession[]).map((session: WeeklySession) => Number(session.score || 0))
      const avgScore = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
      const weak = Array.isArray(profile.weakness_analysis?.weakTopics) ? profile.weakness_analysis.weakTopics.slice(0, 2) : []
      const text = formatReport(profile, {
        streak: 0,
        exams: scores.length,
        avgScore,
        diff: 0,
        weak,
        rank: 1,
        total: Math.max((profiles || []).length, 1),
      })

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: profile.telegram_chat_id, text }),
      })
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (error) {
    console.error('[Weekly Report] Error:', error)
    return NextResponse.json({ error: 'Gagal mengirim weekly report.' }, { status: 500 })
  }
}
