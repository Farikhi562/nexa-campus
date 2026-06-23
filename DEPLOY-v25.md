# Nexa v25 — Arena & Achievements Wiring Guide

> **Prerequisite:** v24 badge system files must already be in your repo
> (`src/components/badges/*` + `src/lib/badges/visuals.ts` + `src/lib/badges/lookup.ts`).
> v25 only adds call sites that consume them.

---

## New files in this package

```
src/
├─ components/
│   ├─ arena/
│   │   ├─ ArenaPostCard.tsx        ← Arena card (replaces old gradient medal card)
│   │   └─ ArenaListExample.tsx     ← Example: fetch /api/arena → render cards
│   └─ achievements/
│       └─ AchievementsView.tsx     ← Achievements page (animated cards + category filter)
└─ app/
    └─ achievements/
        └─ page.example.tsx         ← Example server page wiring (copy & adapt)
```

No existing files are modified. Drop these into your repo.

---

## ① Arena — replace the old card

Find where you currently render Arena post cards and swap the component:

```tsx
import { ArenaPostCard } from '@/components/arena/ArenaPostCard'

// post = item from GET /api/arena response — no API change needed
<ArenaPostCard
  post={post}
  isOwner={post.creator_id === me}
  onWorkspace={(id) => router.push(`/arena/${id}/workspace`)}
  onReview={(id) => router.push(`/arena/${id}/applications`)}
  onEdit={(id) => router.push(`/arena/${id}/edit`)}
  onDelete={async (id) => {
    await fetch(`/api/arena/${id}`, { method: 'DELETE' })
    // refresh list
  }}
  onApply={(id) => router.push(`/arena/${id}/apply`)}
/>
```

`InlineBadge` for creator + team members is already wired inside `ArenaPostCard` —
it reads from `post.creator_featured_badge` and
`post.team_members[].profile.featured_badge` which `/api/arena` already returns.

See `ArenaListExample.tsx` for a full fetch + render example.

---

## ② Achievements — replace emoji cards

### Server page (`src/app/(dashboard)/achievements/page.tsx`)

Use `page.example.tsx` as a starting point — copy, rename the file (drop `.example`),
and adapt the `earnedIds` source to match your data:

```tsx
// Option A — from user_badges table
const { data: rows } = await supabase
  .from('user_badges')
  .select('badge_id')
  .eq('user_id', user.id)
const earnedIds = rows?.map(r => r.badge_id) ?? []

// Option B — from evaluateBadges() if that's how your app works
const { earned } = await evaluateBadges(userId)
const earnedIds = earned.map(b => b.id)
```

### Client component

```tsx
import { AchievementsView } from '@/components/achievements/AchievementsView'

<AchievementsView
  badges={cards}           // BadgeCardData[] — map BADGES via toCardData() (see page.example.tsx)
  earnedIds={earnedIds}
  featuredBadgeId={profile.featured_badge}
/>
```

### What AchievementsView does for you

- Renders animated `BadgeCard` for every badge (same visual as Arena)
- Category filter chips (only shows categories present in your data)
- Sorted: featured → unlocked → locked
- "Jadikan utama" button → `PATCH /api/achievements/featured` (endpoint already exists)
- Optimistic update with rollback on failure

---

## ArenaPost type reference

The `ArenaPost` interface in `ArenaPostCard.tsx` mirrors your existing
`GET /api/arena` response exactly. The fields used for badges:

| field | source |
|-------|--------|
| `creator_featured_badge` | already in /api/arena response |
| `team_members[].profile.featured_badge` | already in /api/arena response |

No backend changes needed.

---

## Order of commits

1. `fix: rename StudyRoadmapStep → RoadmapStep` ← **do this first** (see ⚠️ file)
2. Add v24 badge system files (if not already committed)
3. Add v25 files from this package
4. Adapt `page.example.tsx` → your real `achievements/page.tsx`
5. Swap your Arena card component → `ArenaPostCard`
