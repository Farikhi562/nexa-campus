import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized - invalid cron secret' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*, profiles:user_id(telegram_chat_id, email)')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!schedules?.length) {
      return NextResponse.json({ data: { processed: 0, sent: 0 }, message: 'No schedules to process' })
    }

    let sent = 0
    const now = new Date()

    for (const schedule of schedules) {
      const examDate = new Date(schedule.exam_date)
      const daysUntilExam = Math.floor((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      const reminderType =
        daysUntilExam === 3 && !schedule.reminder_sent_h3 ? 'H-3' :
        daysUntilExam === 1 && !schedule.reminder_sent_h1 ? 'H-1' :
        daysUntilExam === 0 && !schedule.reminder_sent_h0 ? 'H-0' :
        ''

      if (!reminderType) continue

      const updateField =
        reminderType === 'H-3' ? 'reminder_sent_h3' :
        reminderType === 'H-1' ? 'reminder_sent_h1' :
        'reminder_sent_h0'

      const chatId = schedule.telegram_chat_id || schedule.profiles?.telegram_chat_id

      if (!chatId) {
        await supabase.from('schedules').update({ [updateField]: true }).eq('id', schedule.id)
        continue
      }

      const result = await sendTelegramReminder({
        chatId,
        subject: schedule.subject_name,
        reminderType,
        examTime: schedule.exam_time || 'waktu belum ditentukan',
      })

      if (result.success) {
        await supabase.from('schedules').update({ [updateField]: true }).eq('id', schedule.id)
        sent++
        console.log(`[Cron] Telegram reminder sent for schedule ${schedule.id} (${reminderType})`)
      } else {
        console.error(`[Cron] Failed to send Telegram for schedule ${schedule.id}: ${result.error}`)
      }
    }

    return NextResponse.json({
      data: { processed: schedules.length, sent },
      message: `Processed ${schedules.length} schedules, sent ${sent} Telegram reminders`,
    })
  } catch (error) {
    console.error('[Cron Remind] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

export const GET = POST

async function sendTelegramReminder({
  chatId,
  subject,
  reminderType,
  examTime,
}: {
  chatId: string
  subject: string
  reminderType: string
  examTime: string
}): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' }

  const intro =
    reminderType === 'H-3' ? 'Pengingat 3 hari lagi' :
    reminderType === 'H-1' ? 'Pengingat besok' :
    'Pengingat hari ini'

  const text = [
    'NEXA Campus Reminder',
    `${intro}: ${subject}`,
    `Waktu: ${examTime}`,
    '',
    'Buka NEXA untuk latihan, cek materi, dan rapikan agenda kamu.',
  ].join('\n')

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.ok) {
    return { success: false, error: data.description || 'Telegram API error' }
  }

  return { success: true }
}
