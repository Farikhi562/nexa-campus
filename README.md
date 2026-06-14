# NEXA Campus — v1.6.23 (Batch 2)

## ✅ Sudah dikerjakan (file siap timpa)

### 1. Versi 1.6.23 konsisten di semua halaman
- `src/lib/brand.ts` → `version: '1.6.23'` (sumber tunggal; dipakai header, footer, release-notes).
- `src/components/dashboard/nav-items.ts` → label sidebar "Release v1.0.0" yang basi diganti jadi **dinamis** `Release v${BRAND.version}` (otomatis ikut versi), + ditambah entri nav **NEXA Assistant**.

**Patch kecil manual (1 baris) di `src/app/release-notes/page.tsx`:**
Ganti teks hardcoded:
```diff
- NEXA Campus v1.5.23 mulai merapikan pengalaman harian pengguna.
+ NEXA Campus v1.6.23 — NEXA Assistant chatbot, AI multi-provider, dan perbaikan pengalaman harian.
```
(Heading & badge lain di halaman itu sudah pakai `v{BRAND.version}`, jadi otomatis ikut.)

### 2. "Tanya NEXA" → "NEXA Assistant" (chatbot beneran)
- `src/components/ai/AskNexaPanel.tsx` — **dirombak jadi chatbot**: bubble chat user/assistant, multi-turn (nyambung antar pesan), indikator "mengetik", saran cepat, kirim pakai Enter.
- `src/app/api/ask-nexa/route.ts` — menerima `history` (riwayat percakapan) untuk konteks multi-turn; semua teks "Tanya NEXA" → "NEXA Assistant".
- `src/lib/ai/gemini.ts` — system prompt jadi "NEXA Assistant" + dukung history. (Alias lama tetap ada agar import lama tidak rusak.)
- `src/lib/ai/ask-nexa.ts` — teruskan history.
- `AskNexaWidget.tsx` tidak perlu diubah (cuma membungkus panel).

> Sisa string "Tanya NEXA" yang tinggal teks info (di `app/admin/page.tsx` & `supabase/UPDATE_NOTES.md`) boleh diganti manual kalau mau 100% bersih, tapi tidak memengaruhi fungsi.

> Catatan: Batch 2 ini menumpuk di atas Batch 1 (AI multi-provider). `gemini.ts`, `ask-nexa.ts` di sini adalah versi terbaru yang menggantikan versi Batch 1.

---

## 🟡 Belum dikerjakan — butuh kamu pilih dulu (biar gak salah tebak)

Untuk **fitur canggih Study Room / NEXA Arena / Tambah Teman** dan **input deadline cepat**,
aku sengaja belum bangun karena ini menyentuh skema database kamu — kalau ditebak, berisiko gak nyambung.

Aku sudah siapkan menu opsi konkret (lihat chat). Tinggal pilih, nanti aku bangun yang dipilih
lengkap dengan SQL + API + UI-nya.
