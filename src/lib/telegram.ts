/**
 * Telegram Bot utility — server-side only.
 * Jangan import di client component.
 */

const TELEGRAM_API = 'https://api.telegram.org'

export type TelegramResult = { ok: true } | { ok: false; error: string }

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN tidak dikonfigurasi.')
    return { ok: false, error: 'Bot token belum dikonfigurasi.' }
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    const json = await res.json() as { ok: boolean; description?: string }
    if (!json.ok) {
      console.error('[Telegram] API error:', json.description)
      return { ok: false, error: json.description ?? 'Telegram API error.' }
    }
    return { ok: true }
  } catch (err) {
    console.error('[Telegram] Fetch error:', err)
    return { ok: false, error: 'Network error saat menghubungi Telegram.' }
  }
}

// ─── Message templates ───────────────────────────────────────────────────────

type DeadlineInfo = {
  title: string | null
  course_name: string
  deadline_date: string
  deadline_time: string
  campus: string
  room: string
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://campus.nexatechlabs.my.id'

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5) // HH:MM
}

export function buildReminderMessage(type: 'h7' | 'h3' | 'h1' | 'day', d: DeadlineInfo): string {
  const tanggal = formatDate(d.deadline_date)
  const jam = formatTime(d.deadline_time)
  const lokasi = [d.campus, d.room].filter(Boolean).join(' — ')
  const link = `${BASE_URL}/dashboard`

  const headers: Record<typeof type, string> = {
    h7: '📅 <b>NEXA Campus — 7 Hari Lagi</b>',
    h3: '⚡ <b>NEXA Campus — 3 Hari Lagi</b>',
    h1: '⚠️ <b>NEXA Campus — Besok Deadline!</b>',
    day: '🔴 <b>NEXA Campus — Deadline Hari Ini!</b>',
  }

  const footers: Record<typeof type, string> = {
    h7: 'Masih ada waktu. Mulai dari sekarang lebih baik.',
    h3: 'Segera cicil pekerjaan sebelum mepet.',
    h1: 'Kerjain sekarang, jangan sampai menyesal.',
    day: 'Semangat, kamu pasti bisa! 💪',
  }

  return [
    headers[type],
    '',
    `📚 <b>${d.course_name}</b>`,
    d.title ? `📝 ${d.title}` : '',
    `🗓 ${tanggal}, ${jam} WIB`,
    lokasi ? `📍 ${lokasi}` : '',
    '',
    `<i>${footers[type]}</i>`,
    '',
    `<a href="${link}">Buka NEXA Campus →</a>`,
  ].filter((l) => l !== undefined).join('\n')
}

export function buildTestMessage(): string {
  return [
    '✅ <b>NEXA Campus — Tes Berhasil!</b>',
    '',
    'Telegram reminder kamu sudah terhubung dengan benar.',
    'Kamu akan mendapat notifikasi deadline sesuai preferensi yang kamu set.',
    '',
    `<a href="${BASE_URL}/dashboard/settings/reminders">Kelola Pengaturan Reminder →</a>`,
  ].join('\n')
}
