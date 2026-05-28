import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET/POST /api/cron/remind-exams
 * Send WhatsApp reminders for upcoming exams (H-3, H-1, H-0)
 *
 * Setup Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/remind-exams",
 *     "schedule": "0 7 * * *"
 *   }]
 * }
 *
 * Or use external service like EasyCron:
 * https://www.easycron.com/
 * Trigger: POST http://your-domain.com/api/cron/remind-exams?auth=YOUR_CRON_SECRET
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid cron secret' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // Get all active schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*, profiles:user_id(whatsapp_number, email)')

    if (schedulesError) {
      return NextResponse.json({ error: schedulesError.message }, { status: 500 })
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        data: { processed: 0, sent: 0 },
        message: 'No schedules to process',
      })
    }

    let sent = 0
    const now = new Date()

    for (const schedule of schedules) {
      const examDate = new Date(schedule.exam_date)
      const daysUntilExam = Math.floor(
        (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      let shouldSend = false
      let reminderType = ''

      // H-3 (3 days before)
      if (
        daysUntilExam === 3 &&
        !schedule.reminder_sent_h3
      ) {
        shouldSend = true
        reminderType = 'H-3'
      }
      // H-1 (1 day before)
      else if (
        daysUntilExam === 1 &&
        !schedule.reminder_sent_h1
      ) {
        shouldSend = true
        reminderType = 'H-1'
      }
      // H-0 (today)
      else if (
        daysUntilExam === 0 &&
        !schedule.reminder_sent_h0
      ) {
        shouldSend = true
        reminderType = 'H-0'
      }

      if (!shouldSend) continue

      const whatsappNumber =
        schedule.whatsapp_number ||
        schedule.profiles?.whatsapp_number

      if (!whatsappNumber) {
        // Update flag even if no number (skip sending)
        const updateField =
          reminderType === 'H-3'
            ? 'reminder_sent_h3'
            : reminderType === 'H-1'
            ? 'reminder_sent_h1'
            : 'reminder_sent_h0'

        await supabase
          .from('schedules')
          .update({ [updateField]: true })
          .eq('id', schedule.id)

        continue
      }

      // Send WhatsApp (using Twilio)
      const result = await sendWhatsAppReminder(
        whatsappNumber,
        schedule.subject_name,
        reminderType,
        schedule.exam_time || 'waktu belum ditentukan'
      )

      if (result.success) {
        // Update reminder flag
        const updateField =
          reminderType === 'H-3'
            ? 'reminder_sent_h3'
            : reminderType === 'H-1'
            ? 'reminder_sent_h1'
            : 'reminder_sent_h0'

        await supabase
          .from('schedules')
          .update({ [updateField]: true })
          .eq('id', schedule.id)

        sent++
        console.log(`[Cron] WhatsApp reminder sent for schedule ${schedule.id} (${reminderType})`)
      } else {
        console.error(`[Cron] Failed to send WhatsApp for schedule ${schedule.id}: ${result.error}`)
      }
    }

    return NextResponse.json({
      data: { processed: schedules.length, sent },
      message: `Processed ${schedules.length} schedules, sent ${sent} reminders`,
    })
  } catch (err) {
    console.error('[Cron Remind] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

export const GET = POST

/**
 * Send WhatsApp reminder via Twilio
 */
async function sendWhatsAppReminder(
  whatsappNumber: string,
  subject: string,
  reminderType: string,
  examTime: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !fromNumber) {
    console.warn(
      '[WhatsApp] Twilio credentials not configured. Skipping send.'
    )
    return { success: false, error: 'Twilio not configured' }
  }

  const remindText =
    reminderType === 'H-3'
      ? `📚 *Pengingat Ujian 3 Hari Lagi* 📚\n\nMata Kuliah: *${subject}*\nWaktu Ujian: ${examTime}\n\nTetap semangat belajar! Gunakan Diktat.AI untuk latihan soal.\n\n👉 https://diktat.ai`
      : reminderType === 'H-1'
      ? `📚 *Pengingat Ujian Besok!* 📚\n\nMata Kuliah: *${subject}*\nWaktu Ujian: ${examTime}\n\nJangan lupa istirahat yang cukup ✨\n\n👉 https://diktat.ai`
      : `🚀 *Ujian HARI INI!* 🚀\n\nMata Kuliah: *${subject}*\nWaktu Ujian: ${examTime}\n\nSemoga sukses! Yakin diri, kamu pasti bisa! 💪\n\n👉 https://diktat.ai`

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${accountSid}:${authToken}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromNumber,
        To: `whatsapp:${whatsappNumber}`,
        Body: remindText,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.message || 'Twilio API error',
      }
    }

    const data = await response.json()
    return { success: !!data.sid }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
