import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

/**
 * Cek & increment rate limit untuk user yang sedang login, lewat RPC
 * `check_rate_limit` (atomic di sisi Postgres — aman dari race condition,
 * lihat docs/MIGRATION_security_hardening.sql).
 *
 * @param routeKey  identifier unik per endpoint, mis. 'ai-extract', 'ask-nexa'
 * @param limit     maksimal request yang diizinkan dalam 1 window
 * @param windowSeconds  panjang window dalam detik (mis. 3600 = per jam)
 *
 * PENTING: fail-open kalau RPC belum ada (migration belum dijalankan) atau
 * error tak terduga lainnya — supaya fitur AI tidak mati total kalau
 * deployment kode mendahului migration SQL. Begitu migration dijalankan,
 * proteksi otomatis aktif tanpa perlu redeploy kode.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  routeKey: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_route_key: routeKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      console.warn(`[rate-limit] gagal cek "${routeKey}", fail-open (izinkan):`, error.message)
      return { allowed: true }
    }

    if (data === true) return { allowed: true }
    return { allowed: false, retryAfterSeconds: windowSeconds }
  } catch (err) {
    console.warn(`[rate-limit] exception saat cek "${routeKey}", fail-open:`, err)
    return { allowed: true }
  }
}

/** Pesan error standar untuk respons 429, sudah dalam Bahasa Indonesia ramah. */
export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60)
  return `Terlalu banyak permintaan. Coba lagi dalam ${minutes} menit.`
}
