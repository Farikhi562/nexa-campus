# NEXA Campus v1.6.33 — Profile Plan Access Hotfix

Fix untuk kasus `/dashboard/nexa-assistant` masih membaca plan `radar` padahal akun sudah diset `command`.

## Penyebab

`src/lib/billing/server.ts` lama men-select kolom `user_id` dari `public.profiles`:

```ts
.select('id,user_id,full_name,...')
```

Di schema NEXA Campus kamu, `profiles.user_id` tidak ada. Yang dipakai adalah:

```txt
profiles.id = auth.users.id
```

Akibatnya query profile gagal, `getUserPlanAccess()` mengembalikan profile null, lalu plan fallback ke `radar`.

## Isi patch

- `src/lib/billing/server.ts`
  - tidak lagi select `user_id`
  - baca profile pakai `profiles.id = auth.users.id`
  - fallback by email
  - owner/admin email bisa dianggap Command via env
- `src/app/api/debug/plan/route.ts`
  - endpoint debug untuk cek plan yang dibaca aplikasi

## Env yang disarankan

Isi salah satu atau semuanya di Vercel:

```env
NEXA_OWNER_EMAILS=fauzanalfa36@gmail.com
COMMAND_LIFETIME_EMAILS=fauzanalfa36@gmail.com
ADMIN_EMAILS=fauzanalfa36@gmail.com
```

`NEXA_OWNER_EMAILS` paling bersih untuk owner lifetime.

## SQL owner lifetime

```sql
update public.profiles
set
  plan = 'command',
  plan_status = 'active',
  plan_started_at = coalesce(plan_started_at, now()),
  plan_expires_at = '2099-12-31 23:59:59+07'
where id = (
  select id
  from auth.users
  where lower(email) = lower('fauzanalfa36@gmail.com')
  limit 1
);
```

## Cara pasang Windows CMD

```bat
xcopy /E /Y "nexa_v1_6_33_profile_plan_access_hotfix\*" "."
npm run build
git add -A
git commit -m "fix: read profile plan from id schema"
git push
```

## Test

Buka:

```txt
/api/debug/plan
```

Harus muncul:

```json
{
  "plan": "command",
  "ownerOverride": true
}
```

Lalu buka:

```txt
/dashboard/nexa-assistant
```
