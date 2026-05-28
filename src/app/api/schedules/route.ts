import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/types'
import type { Plan } from '@/types'

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

    // Check plan — schedules with WhatsApp reminders are Pro only
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, whatsapp_number')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Jadwal dengan pengingat WhatsApp hanya tersedia untuk paket Pro.' },
        { status: 403 }
      )
    }

    const { subject_name, exam_date, exam_time, document_id, whatsapp_number } =
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

    // Validate WhatsApp number if provided
    let finalWhatsAppNumber = whatsapp_number || profile?.whatsapp_number
    if (finalWhatsAppNumber) {
      const cleanNumber = finalWhatsAppNumber.replace(/\D/g, '')
      if (cleanNumber.length < 10) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp tidak valid.' },
          { status: 400 }
        )
      }
    }

    const { data: schedule, error } = await supabase
      .from('schedules')
      .insert({
        user_id: user.id,
        subject_name: subject_name.trim(),
        exam_date,
        exam_time: exam_time || null,
        document_id: document_id || null,
        whatsapp_number: finalWhatsAppNumber || null,
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

    const { subject_name, exam_date, exam_time, document_id, whatsapp_number } =
      await request.json()

    const updates: Record<string, unknown> = {}
    if (subject_name !== undefined) updates.subject_name = subject_name.trim()
    if (exam_date !== undefined) updates.exam_date = exam_date
    if (exam_time !== undefined) updates.exam_time = exam_time
    if (document_id !== undefined) updates.document_id = document_id
    if (whatsapp_number !== undefined) updates.whatsapp_number = whatsapp_number

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
