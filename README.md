# NEXA Campus v1.6.35 — Command Assistant Runtime Hotfix

Patch ini ngebenerin error NEXA Assistant Command Center yang cuma muncul:

```txt
Command Assistant lagi gagal eksekusi. TypeScript mungkin sedang minta tumbal.
```

## Yang dibenerin

- Frontend sekarang nampilin `answer` dari API walaupun HTTP status bukan 200.
- API `/api/nexa-assistant/command` dibungkus full try/catch biar nggak mati bisu.
- Usage limit check kalau migration belum jalan tidak langsung bunuh Command Assistant.
- Kalau AI provider/env belum aktif, Command Assistant tetap jawab pakai **local fallback mode**.
- Risk Scan, Battle Plan, Reminder Architect, Notification Copilot, Arena Coach tetap jalan walau AI provider lagi kosong/ngambek.
- Debug endpoint baru:

```txt
/api/debug/nexa-command
```

## File yang diubah/ditambah

```txt
src/app/api/nexa-assistant/command/route.ts
src/components/ai/NexaCommandAssistantPage.tsx
src/app/api/debug/nexa-command/route.ts
```

## Cara pasang di Windows CMD

Dari root project:

```bat
xcopy /E /Y "nexa_v1_6_35_command_assistant_runtime_hotfix\*" "."
npm run build
git add -A
git commit -m "fix: stabilize command assistant runtime"
git push
```

## Test setelah deploy

1. Buka:

```txt
/api/debug/nexa-command
```

Pastikan `plan` kebaca `command`.

2. Buka:

```txt
/dashboard/nexa-assistant
```

3. Coba prompt:

```txt
Scan semua deadline gue. Kasih risk score, mana yang bahaya, dan cara nyelamatinnya.
```

Kalau AI key belum ada pun, harus tetap jawab pakai fallback lokal.

## Catatan env

Supaya AI beneran hidup, tetap isi salah satu provider env yang dipakai project lu, misalnya:

```env
GEMINI_API_KEY=xxxxx
```

atau env provider lain sesuai `src/lib/ai/llm.ts` project lu.

Kalau belum isi AI key, patch ini tetap bikin Command Center jalan, tapi jawabannya local fallback, bukan model AI penuh.
