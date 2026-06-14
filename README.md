# NEXA v1.6.41 Badges Me Type Hotfix

Fix file build error:

`src/app/api/badges/me/route.ts`

Masalahnya `access.profile.email` kebaca TypeScript sebagai `unknown`, lalu dikirim ke `isOwnerEmail()` yang butuh `string | null | undefined`.

Patch ini hanya mengganti file itu. Tidak perlu SQL migration.

## Install Windows CMD

```bat
xcopy /E /Y "nexa_v1_6_41_badges_me_type_hotfix\*" "."
npm run build
git add -A
git commit -m "fix: type badge owner email lookup"
git push
```
