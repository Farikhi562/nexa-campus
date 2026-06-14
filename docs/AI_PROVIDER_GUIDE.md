# Panduan AI NEXA Campus — Pilih Model GRATIS

Masalah lama: kode "ngunci" ke Google Gemini (`gemini-2.5-flash`). Kalau kuota/region/billing
bermasalah, semua fitur AI mati. Sekarang AI sudah **bisa ganti provider cuma lewat ENV**,
tanpa ubah kode.

## Cara ganti (cukup 2 baris ENV di Vercel → Settings → Environment Variables)

```
AI_PROVIDER = groq
AI_API_KEY  = gsk_xxxxxxxxxxxxxxxxxxxx
```

Lalu redeploy. Selesai. Semua fitur AI (Tanya NEXA, AI Quick Add teks, AI baca foto) langsung pindah.

## Opsi GRATIS (pilih salah satu)

| Provider | ENV `AI_PROVIDER` | Gratis? | Baca foto? | Catatan | Ambil API key |
|---|---|---|---|---|---|
| **Groq** (rekomendasi) | `groq` | Ya, generous | Ya | Paling cepat, stabil, model Llama 3.3 70B | https://console.groq.com/keys |
| **OpenRouter** | `openrouter` | Ada model `:free` | Ya | Banyak pilihan model, tinggal ganti `AI_TEXT_MODEL` | https://openrouter.ai/keys |
| **Cerebras** | `cerebras` | Ya | Tidak | Tercepat untuk teks, tapi belum bisa baca foto | https://cloud.cerebras.ai |
| **Google Gemini** | `gemini` | Free tier | Ya | Opsi lama, pakai kalau kuota tersedia | https://aistudio.google.com/apikey |

> Rekomendasi: mulai dari **Groq**. Gratis, cepat, dan sudah mendukung baca foto.

## ENV lengkap yang dikenali

| ENV | Fungsi | Default |
|---|---|---|
| `AI_PROVIDER` | Pilih provider: `groq` / `openrouter` / `cerebras` / `gemini` | `groq` (kalau ada key), atau `gemini` |
| `AI_API_KEY` | API key generik (menang atas key spesifik) | — |
| `GROQ_API_KEY` / `OPENROUTER_API_KEY` / `CEREBRAS_API_KEY` / `GEMINI_API_KEY` | Key spesifik per provider (alternatif `AI_API_KEY`) | — |
| `AI_TEXT_MODEL` | Override model teks | sesuai provider |
| `AI_VISION_MODEL` | Override model baca foto | sesuai provider |

Contoh pakai OpenRouter model gratis lain:
```
AI_PROVIDER     = openrouter
AI_API_KEY      = sk-or-xxxx
AI_TEXT_MODEL   = meta-llama/llama-3.3-70b-instruct:free
AI_VISION_MODEL = meta-llama/llama-3.2-11b-vision-instruct:free
```

## Catatan kompatibilitas
- Kalau AI belum dikonfigurasi, AI Quick Add (teks) **tetap jalan** pakai parser sederhana bawaan (fallback). Fitur lain tidak ikut mati.
- Cerebras belum punya model vision — kalau dipilih, fitur "baca foto" akan memberi pesan ramah dan menyarankan provider lain. Fitur teks tetap jalan.
- Variabel lama `GEMINI_API_KEY` / `GEMINI_MODEL` masih dikenali (mode `gemini`).
