# NEXA Campus v1.6.31 - Plan Scope + Feature Gates

Patch ini nambah scope final buat 3 plan:

- **Radar** = gratis/basic survival
- **Pulse** = Rp18.000/bulan/produktif harian
- **Command** = Rp30.000/bulan/power user, AI, tim, lomba

## Isi patch

```txt
src/lib/billing/plans.ts
src/lib/billing/access.ts
src/lib/billing/server.ts
src/components/billing/FeatureGate.tsx
src/components/billing/UpgradePromptCard.tsx
src/components/billing/UsageLimitBadge.tsx
src/components/billing/PlanScopeMatrix.tsx
src/app/pricing/scope/page.tsx
src/app/api/billing/access/route.ts
src/app/api/billing/usage/consume/route.ts
src/app/api/ask-nexa/route.ts
src/app/dashboard/study-room/[id]/call/page.tsx
supabase/migrations/20260615_plan_scope_feature_gates.sql
```

## Yang langsung aktif

1. **Plan config lengkap**
   - Radar, Pulse, Command dengan fitur dan batasan final.

2. **Feature gate helper**
   - `canUseFeature(plan, featureKey)`
   - `getDailyLimit(plan, featureKey)`
   - `PLAN_LIMITS`
   - `FEATURE_META`

3. **Usage limit harian**
   - Radar: NEXA Assistant 5 chat/hari, AI Quick Add 0x/hari
   - Pulse: NEXA Assistant 30 chat/hari, AI Quick Add 10x/hari
   - Command: NEXA Assistant 100 chat/hari, AI Quick Add 100x/hari

4. **Ask NEXA gated**
   - Radar bisa chat 5x/hari.
   - Radar bisa preview parse deadline, tapi belum bisa save.
   - Pulse bisa save deadline via AI Quick Add 10x/hari.
   - Command bisa AI Quick Add 100x/hari.

5. **Study Room call gated**
   - `/dashboard/study-room/[id]/call` cuma buat Command.

6. **Pricing scope page**
   - Buka `/pricing/scope` buat lihat matrix batasan plan.

## Cara pasang

Dari root project:

```bat
xcopy /E /Y "nexa_v1_6_31_plan_scope_feature_gates\*" "."
```

Atau extract manual lalu timpa file ke project.

Jalankan migration ini di Supabase SQL Editor:

```txt
supabase/migrations/20260615_plan_scope_feature_gates.sql
```

Lalu build:

```bat
npm run build
git add -A
git commit -m "feat: add plan scope and feature gates"
git push
```

## Cara pakai FeatureGate di UI

```tsx
import FeatureGate from '@/components/billing/FeatureGate'

<FeatureGate featureKey="study_room_voice_video" currentPlan={profile.plan}>
  <VoiceVideoCall />
</FeatureGate>
```

Kalau tidak mau passing `currentPlan`, component akan fetch `/api/billing/access` otomatis.

## Contoh cek akses di API

```ts
import { consumeFeatureUsage } from '@/lib/billing/server'

const usage = await consumeFeatureUsage({
  userId: user.id,
  featureKey: 'ai_quick_add',
})

if (!usage.allowed) {
  return Response.json({ error: usage.message }, { status: 429 })
}
```

## Feature key penting

```txt
nexa_assistant_chat
ai_quick_add
ai_quick_add_save
telegram_notifications
email_notifications
custom_reminders
study_room_voice_video
friends_qr
arena_create_team
arena_team_leaderboard
```

## Catatan penting

- Patch ini aman setelah v1.6.30.
- Pastikan migration jalan dulu sebelum test Ask NEXA, karena route baru butuh tabel `feature_usage_daily` dan function `consume_feature_usage`.
- Kalau `profiles` project lo pakai `id` atau `user_id`, helper sudah coba dua-duanya. Ya, database schema manusia memang suka bikin AI ikut terapi.
