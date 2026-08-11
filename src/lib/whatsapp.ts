/**
 * WhatsApp reminder via Wablas — server-side only.
 * Jangan import di client component.
 *
 * Wablas itu WhatsApp API gateway pihak ketiga (bukan resmi Meta) yang
 * dipakai dengan cara scan QR ke nomor WA milik akun Wablas kamu sendiri —
 * BUKAN nomor pribadi/kampus mahasiswa. Setiap akun Wablas punya
 * sub-domain + endpoint sendiri (contoh: https://<namaserver>.wablas.com/api/send-message),
 * makanya endpoint-nya diambil penuh dari env var, bukan di-hardcode di sini.
 *
 * Setup: daftar di wablas.com → tambah device → scan QR pakai nomor WA
 * khusus buat NEXA Campus → copy "Token" dari dashboard → isi env:
 *   WABLAS_API_URL=https://<namaserver-kamu>.wablas.com/api/send-message
 *   WABLAS_TOKEN=<token dari dashboard, kadang berformat token.secret>
 *
 * CATATAN: format response sukses/gagal bisa sedikit beda antar versi akun
 * Wablas. Fungsi di bawah ini defensif — kalau HTTP-nya 200 dan body tidak
 * secara eksplisit bilang status:false, dianggap terkirim. Kalau ternyata
 * pesan tetap tidak sampai padahal fungsi ini bilang "ok", cek log mentah
 * di reminder_logs.provider_message atau dashboard Wablas kamu.
 */

export type WhatsAppResult = { ok: true } | { ok: false; error: string }

export function waConfigured(): boolean {
  return Boolean(process.env.WABLAS_API_URL && process.env.WABLAS_TOKEN)
}

/**
 * Normalisasi nomor HP Indonesia ke format yang dipakai Wablas: diawali 62,
 * tanpa spasi/strip/plus. Terima input umum yang biasa diketik user:
 * "08123..." , "+62812..." , "62812...", atau "812..." (tanpa awalan).
 */
export function normalizeIndonesianPhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '')
  if (!digits) return null
  if (digits.startsWith('620')) return `62${digits.slice(3)}` // salah ketik umum: 620812xxxx
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export async function sendWhatsAppMessage(phoneRaw: string, message: string): Promise<WhatsAppResult> {
  const apiUrl = process.env.WABLAS_API_URL
  const token = process.env.WABLAS_TOKEN
  if (!apiUrl || !token) {
    console.warn('[WhatsApp] WABLAS_API_URL / WABLAS_TOKEN belum dikonfigurasi.')
    return { ok: false, error: 'WhatsApp gateway belum dikonfigurasi di server.' }
  }

  const phone = normalizeIndonesianPhone(phoneRaw)
  if (!phone) {
    return { ok: false, error: 'Nomor WhatsApp tidak valid.' }
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(15_000),
    })

    const raw = await res.text()
    let data: { status?: boolean | string; message?: string } | null = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = null
    }

    if (!res.ok) {
      return { ok: false, error: `Wablas HTTP ${res.status}: ${raw.slice(0, 200)}` }
    }
    if (data && (data.status === false || data.status === 'false')) {
      return { ok: false, error: data.message || 'Wablas menolak pesan ini.' }
    }

    return { ok: true }
  } catch (err) {
    console.error('[WhatsApp] Fetch error:', err)
    return { ok: false, error: 'Network error saat menghubungi Wablas.' }
  }
}

// ─── Message templates (format WhatsApp: *bold*, bukan HTML) ────────────────

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
  return timeStr.slice(0, 5)
}

export function buildWhatsAppReminderMessage(type: 'h7' | 'h3' | 'h1' | 'day', d: DeadlineInfo): string {
  const tanggal = formatDate(d.deadline_date)
  const jam = formatTime(d.deadline_time)
  const lokasi = [d.campus, d.room].filter(Boolean).join(' — ')

  const headers: Record<typeof type, string> = {
    h7: '📅 *NEXA Campus — 7 Hari Lagi*',
    h3: '⚡ *NEXA Campus — 3 Hari Lagi*',
    h1: '⚠️ *NEXA Campus — Besok Deadline!*',
    day: '🔴 *NEXA Campus — Deadline Hari Ini!*',
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
    `📚 *${d.course_name}*`,
    d.title ? `📝 ${d.title}` : '',
    `🗓 ${tanggal}, ${jam} WIB`,
    lokasi ? `📍 ${lokasi}` : '',
    '',
    `_${footers[type]}_`,
    '',
    `Buka NEXA Campus: ${BASE_URL}/dashboard`,
  ].filter((l) => l !== undefined).join('\n')
}

export function buildWhatsAppTestMessage(): string {
  return [
    '✅ *NEXA Campus — Tes Berhasil!*',
    '',
    'Reminder WhatsApp kamu sudah terhubung dengan benar.',
    'Kamu akan dapat notifikasi deadline sesuai preferensi yang kamu set.',
    '',
    `Kelola Pengaturan Reminder: ${BASE_URL}/dashboard/settings/reminders`,
  ].join('\n')
}
