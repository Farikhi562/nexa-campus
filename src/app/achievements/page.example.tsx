/**
 * CONTOH wiring halaman Pencapaian.
 * Sesuaikan path & cara ambil earnedIds dengan struktur appmu.
 *
 * Letakkan di: src/app/(dashboard)/achievements/page.tsx  (atau rute pencapaianmu)
 */

import { BADGES } from '@/lib/badges'
import { createClient } from '@/lib/supabase/server'
import { AchievementsView } from '@/components/achievements/AchievementsView'
import type { BadgeCardData } from '@/components/badges'

// Map registry BADGES → BadgeCardData. Sesuaikan nama field kalau beda.
function toCardData(): BadgeCardData[] {
  return (BADGES as Array<Record<string, unknown>>).map((b) => ({
    id: String(b.id),
    name: String(b.name ?? b.title ?? 'Badge'),
    description: String(b.description ?? ''),
    requirement: String(b.requirement ?? b.criteria ?? b.hint ?? ''),
    category: String(b.category ?? b.type ?? 'generic'),
    tier: String(b.tier ?? b.rarity ?? 'common'),
    unlocked: false, // diisi di view via earnedIds
  }))
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let earnedIds: string[] = []
  let featuredBadgeId: string | null = null

  if (user) {
    // featured badge
    const { data: profile } = await supabase
      .from('profiles')
      .select('featured_badge')
      .eq('id', user.id)
      .maybeSingle()
    featuredBadgeId = (profile as { featured_badge?: string | null } | null)?.featured_badge ?? null

    // earned badges — sesuaikan dengan sumber kebenaranmu.
    // Contoh kalau ada tabel user_badges:
    const { data: rows } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id)
    earnedIds = (rows ?? []).map((r) => String((r as { badge_id: unknown }).badge_id))

    // Alternatif: kalau status earned dihitung dari evaluateBadges(stats),
    // panggil di sini lalu isi earnedIds dari hasilnya.
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <AchievementsView
        badges={toCardData()}
        earnedIds={earnedIds}
        featuredBadgeId={featuredBadgeId}
      />
    </div>
  )
}
