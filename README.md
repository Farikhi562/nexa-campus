# NEXA Campus v1.6.32 — Command Assistant Page

Patch ini nambah halaman khusus:

```txt
/dashboard/nexa-assistant
```

Nav item `NEXA Assistant` di sidebar/hamburger mobile diarahkan ke halaman baru ini, bukan lagi anchor `#nexa-assistant`.

## Isi fitur

- Dedicated page NEXA Assistant Command Center.
- Halaman terkunci khusus plan `command`.
- Radar/Pulse akan lihat upgrade page.
- Command user dapat UI overpower:
  - Command Briefing
  - Deadline Risk Scan
  - Study Battle Plan
  - Deadline Executor
  - Reminder Architect
  - Notification Copilot
  - Arena Coach
- API baru:

```txt
/api/nexa-assistant/command
```

API ini ngecek plan user. Kalau bukan Command, return 402 locked.

## File yang ditambah/diubah

```txt
src/app/dashboard/nexa-assistant/page.tsx
src/components/ai/NexaCommandAssistantPage.tsx
src/app/api/nexa-assistant/command/route.ts
src/components/dashboard/nav-items.ts
```

## Cara pasang di CMD Windows

Dari root project:

```bat
xcopy /E /Y "nexa_v1_6_32_command_assistant_page\*" "."
npm run build
git add -A
git commit -m "feat: add command only nexa assistant page"
git push
```

## Syarat

Patch ini idealnya dipasang setelah v1.6.31 karena butuh:

```txt
src/lib/billing/server.ts
src/lib/billing/access.ts
feature_usage_daily
consume_feature_usage
```

Kalau belum jalan migration v1.6.31, jalankan dulu:

```txt
supabase/migrations/20260615_plan_scope_feature_gates.sql
```

## Test

1. Login akun Radar/Pulse, buka `/dashboard/nexa-assistant`, harus muncul upgrade page.
2. Set profile plan ke Command:

```sql
update public.profiles
set plan = 'command', plan_status = 'active', plan_expires_at = now() + interval '30 days'
where email = 'email_user_lu@gmail.com';
```

3. Buka `/dashboard/nexa-assistant`.
4. Test module `Command Briefing`.
5. Test `Deadline Executor` dengan contoh:

```txt
tambahin deadline tugas kalkulus besok jam 8 malam prioritas tinggi
```

