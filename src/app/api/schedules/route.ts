import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'
import { hasProAccess } from '@/lib/plans'

/**
 * GET /api/schedules
 * Get all exam schedules for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: schedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('exam_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(schedules || [])
  } catch (err) {
    console.error('[Schedules GET] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

/**
 * POST /api/schedules
 * Create a new exam schedule (Pro only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check plan - schedules with Telegram reminders are Pro only
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, seat_owner_id, telegram_chat_id')
      .eq('id', user.id)
      .single()

    if (!hasProAccess(profile as Pick<Profile, 'plan' | 'seat_owner_id'> | null)) {
      return NextResponse.json(
        { error: 'Jadwal dengan pengingat Telegram hanya tersedia untuk paket Pro.' },
        { status: 403 }
      )
    }

    const { subject_name, exam_date, exam_time, document_id, telegram_chat_id } =
      await request.json()

    if (!subject_name?.trim() || !exam_date) {
      return NextResponse.json(
        { error: 'subject_name dan exam_date wajib diisi.' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateObj = new Date(exam_date)
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Format exam_date tidak valid.' }, { status: 400 })
    }

    let finalTelegramChatId = telegram_chat_id || profile?.telegram_chat_id
    if (finalTelegramChatId && !/^-?\d{5,20}$/.test(String(finalTelegramChatId))) {
      return NextResponse.json(
        { error: 'Telegram chat_id tidak valid.' },
        { status: 400 }
      )
    }

    let finalDocumentId = document_id || null
    if (finalDocumentId) {
      const { data: doc } = await supabase
        .from('documents')
        .select('id')
        .eq('id', finalDocumentId)
        .eq('user_id', user.id)
        .single()

      if (!doc) return NextResponse.json({ error: 'Dokumen tidak valid.' }, { status: 400 })
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        user_id: user.id,
        subject_name: subject_name.trim(),
        exam_date,
        exam_time: exam_time || null,
        document_id: finalDocumentId,
        telegram_chat_id: finalTelegramChatId || null,
        reminder_sent_h3: false,
        reminder_sent_h1: false,
        reminder_sent_h0: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(schedule, { status: 201 })
  } catch (err) {
    console.error('[Schedules POST] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

/**
 * PUT /api/schedules?id=<scheduleId>
 * Update exam schedule
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 })
    }

    // Verify ownership
    const { data: schedule } = await supabase
      .from('schedules')
      .select('id')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (!schedule) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 })
    }

    const { subject_name, exam_date, exam_time, document_id, telegram_chat_id } =
      await request.json()

    const updates: Record<string, unknown> = {}
    if (subject_name !== undefined) {
      if (!String(subject_name).trim()) return NextResponse.json({ error: 'subject_name tidak valid.' }, { status: 400 })
      updates.subject_name = String(subject_name).trim().slice(0, 160)
    }
    if (exam_date !== undefined) {
      const nextDate = new Date(exam_date)
      if (isNaN(nextDate.getTime())) return NextResponse.json({ error: 'Format exam_date tidak valid.' }, { status: 400 })
      updates.exam_date = exam_date
    }
    if (exam_time !== undefined) updates.exam_time = exam_time || null
    if (document_id !== undefined) {
      if (document_id) {
        const { data: doc } = await supabase
          .from('documents')
          .select('id')
          .eq('id', document_id)
          .eq('user_id', user.id)
          .single()
        if (!doc) return NextResponse.json({ error: 'Dokumen tidak valid.' }, { status: 400 })
      }
      updates.document_id = document_id || null
    }
    if (telegram_chat_id !== undefined) {
      if (telegram_chat_id && !/^-?\d{5,20}$/.test(String(telegram_chat_id))) {
        return NextResponse.json({ error: 'Telegram chat_id tidak valid.' }, { status: 400 })
      }
      updates.telegram_chat_id = telegram_chat_id || null
    }

    const { data: updated, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[Schedules PUT] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

/**
 * DELETE /api/schedules?id=<scheduleId>
 * Delete exam schedule
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 })
    }

    // Verify ownership
    const { data: schedule } = await supabase
      .from('schedules')
      .select('id')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (!schedule) {
      return NextResponse.json({ error: 'Jadwal tidak ditemukan.' }, { status: 404 })
    }

    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[Schedules DELETE] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
