# Nexa v24 — Badge System Deployment Guide

## ① Fix build error first (1-line change)

**File:** `src/app/api/study/packs/[id]/flashcards/route.ts`

```diff
- import type { StudyRoadmapStep } from '@/lib/study/types'
+ import type { RoadmapStep } from '@/lib/study/types'
```

Then rename every usage of `StudyRoadmapStep` → `RoadmapStep` in that same file.
The compiler already told you the correct name: `Did you mean 'RoadmapStep'?`

---

## ② Drop in the badge system files

Copy these 8 files from this package into your repo — **no existing files are
modified** by this step:

```
src/
├─ lib/badges/
│   ├─ visuals.ts        ← tier + category registry (source of truth)
│   └─ lookup.ts         ← auto-resolves category/tier from BADGES by id
└─ components/badges/
    ├─ icons.tsx          ← 9 SVG animated icons (one per category)
    ├─ AnimatedBadge.module.css  ← all keyframes + prefers-reduced-motion
    ├─ AnimatedBadge.tsx  ← MAIN component — use everywhere
    ├─ BadgeCard.tsx      ← achievement card (replaces emoji cards)
    ├─ InlineBadge.tsx    ← xs/sm variant for arena / friend list
    └─ index.ts           ← barrel export
```

---

## ③ Wire it up — 2 call sites

### A. Achievements page — replace emoji cards

```tsx
import { BadgeGrid, type BadgeCardData } from '@/components/badges'

const cards: BadgeCardData[] = BADGES.map((b) => ({
  id:          b.id,
  name:        b.name,
  description: b.description,
  requirement: b.requirement,
  category:    b.category,   // or b.type / b.group if named differently
  tier:        b.tier,       // or b.rarity / b.level if named differently
  unlocked:    earnedIds.includes(b.id),
}))

<BadgeGrid badges={cards} />
```

### B. Arena / friend list — replace gradient medal

```tsx
import { InlineBadge } from '@/components/badges'

<span className="inline-flex items-center gap-1.5">
  {creatorName}
  <InlineBadge badgeId={creator_featured_badge} size="xs" />
</span>
```

`InlineBadge` auto-resolves shape and colour from the BADGES registry via
`lookup.ts` — **no API changes needed**.

---

## Valid values

| field | accepted values |
|-------|----------------|
| `category` | `deadline` · `referral` · `leaderboard` · `study` · `arena` · `streak` · `social` · `founder` · `generic` |
| `tier` | `common` · `rare` · `epic` · `legend` · `mythos` |

Unknown values fall back safely to `generic` / `common` — no crash.

---

## Size reference

| size | px | where |
|------|----|-------|
| `xs` | 20 | inline next to name (arena, friends, chat) |
| `sm` | 32 | small chip, list |
| `md` | 56 | achievement card |
| `lg` | 88 | profile header / badge detail modal |

---

## One dependency check

`lookup.ts` imports `BADGES` from `@/lib/badges`. That must be a plain data
array (not a server-only module). If the build fails with a server-only
error on the client, move just the `BADGES` array to `@/lib/badges/data.ts`
and update the one import line in `lookup.ts`.

---

## Extending later

- **New category:** add to `BadgeCategory` + `CATEGORY_LABEL` in `visuals.ts`,
  create an icon function in `icons.tsx`, register in `ICON_BY_CATEGORY`.
- **New tier:** add an entry to `TIER_THEME` in `visuals.ts`.
- **Override one badge's icon:** add `'badge_id': 'category'` to
  `BADGE_ICON_OVERRIDE` in `visuals.ts`.

No database changes. Pure display layer.
