export type NudgeArmId = 'neutral' | 'urgency' | 'supportive' | 'question'

export const NUDGE_ARMS: NudgeArmId[] = ['neutral', 'urgency', 'supportive', 'question']

function formatDate(dateStr: string): string {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch {
    return dateStr
  }
}

/**
 * 4 gaya pesan nudge yang DISTINCT — ini "arm" yang dipilih bandit
 * (lib/ml/bandit.ts). Murni template (bukan panggilan AI/LLM) supaya
 * bandit benar-benar memilih di antara pilihan yang TETAP/terukur —
 * kalau teksnya digenerate ulang tiap saat oleh LLM, tidak ada "arm" yang
 * konsisten untuk dipelajari.
 */
export function buildNudgeMessage(arm: NudgeArmId, courseName: string, deadlineDate: string): string {
  const date = formatDate(deadlineDate)
  switch (arm) {
    case 'neutral':
      return `📌 ${courseName}: deadline ${date}. Yuk disiapkan dari sekarang.`
    case 'urgency':
      return `⚠️ ${courseName} makin dekat (${date}). Riwayatmu menunjukkan tugas tipe ini sering mepet — gas dari sekarang.`
    case 'supportive':
      return `💪 ${courseName} due ${date}. Kamu sudah sering menyelesaikan tugas tepat waktu — lanjutkan ritmenya!`
    case 'question':
      return `${courseName} due ${date}. Udah mulai dikerjain belum?`
  }
}

export function isNudgeArm(value: unknown): value is NudgeArmId {
  return typeof value === 'string' && (NUDGE_ARMS as string[]).includes(value)
}
