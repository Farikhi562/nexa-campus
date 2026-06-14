# NEXA Campus v1.6.28 Study Room Slug Hotfix

Fix untuk error Vercel/Next.js:

> You cannot use different slug names for the same dynamic path ('id' !== 'roomId').

Penyebab:
Next.js tidak mengizinkan path sibling dynamic yang sama tapi nama param beda, misalnya:

- `src/app/dashboard/study-room/[id]/...`
- `src/app/dashboard/study-room/[roomId]/call/...`

Solusi:
Pakai satu nama segment saja: `[id]`.

## Cara pasang manual

1. Hapus folder lama:

```bash
rm -rf "src/app/dashboard/study-room/[roomId]"
```

2. Copy folder `src/app/dashboard/study-room/[id]/call` dari patch ini ke project.

3. Build test:

```bash
npm run build
```

4. Commit dan push:

```bash
git add .
git commit -m "fix: align study room dynamic route slug"
git push
```

## Cara pasang via script

Dari root project:

```bash
bash scripts/fix-study-room-slug.sh
npm run build
```
