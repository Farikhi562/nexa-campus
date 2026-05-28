# Diktat.AI 🎓

**AI-Powered Mock Exam & CBT Simulator untuk Mahasiswa Indonesia**

Upload diktat PDF → AI ekstrak soal → Langsung ujian. Dalam 2 menit.

---

## 🚀 Setup dari Nol (Step by Step)

### Prerequisites
- Node.js 18+ (`node -v`)
- npm atau pnpm
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [OpenAI](https://platform.openai.com) (butuh kredit ~$1)
- API key [OCR.space](https://ocr.space/ocrapi) (gratis via email)

---

### 1. Clone & Install

```bash
# Clone atau ekstrak project
cd diktat-ai

# Install dependencies
npm install
```

---

### 2. Setup Supabase

1. Buka [supabase.com](https://supabase.com) → New Project
2. Catat: **Project URL** dan **anon key** (Settings > API)
3. Catat: **service_role key** (Settings > API > Service role — keep secret!)
4. Buka **SQL Editor** di dashboard Supabase
5. Copy-paste seluruh isi file `supabase/schema.sql` → Run

> ⚠️ Aktifkan Google OAuth di **Authentication > Providers > Google** jika ingin login Google.

---

### 3. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

OPENAI_API_KEY=sk-...

# OCR.space free key (works for testing):
OCR_SPACE_API_KEY=helloworld

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) 🎉

---

### 5. Deploy ke Vercel (Production)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel dashboard
# atau via CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add OCR_SPACE_API_KEY
```

---

## 📁 Struktur Project

```
diktat-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css
│   │   ├── auth/
│   │   │   ├── login/page.tsx          # Login (Google OAuth + Magic Link)
│   │   │   └── callback/route.ts       # Auth callback
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Auth guard + sidebar
│   │   │   ├── page.tsx                # Dashboard utama
│   │   │   ├── upload/page.tsx         # Upload diktat
│   │   │   └── jadwal/page.tsx         # Jadwal ujian (Pro)
│   │   ├── exam/
│   │   │   └── [sessionId]/
│   │   │       ├── page.tsx            # CBT exam interface
│   │   │       └── results/page.tsx    # Hasil & analisis
│   │   ├── study-room/
│   │   │   ├── page.tsx                # List & join rooms
│   │   │   └── [roomId]/page.tsx       # Leaderboard room
│   │   └── api/
│   │       ├── process/route.ts        # OCR + AI processing
│   │       ├── sessions/route.ts       # Create exam session
│   │       ├── sessions/[id]/
│   │       │   └── submit/route.ts     # Submit answers
│   │       └── study-rooms/
│   │           ├── route.ts            # Create room
│   │           └── join/route.ts       # Join room
│   ├── components/
│   │   ├── ui/                         # Button, Card, Badge
│   │   ├── DashboardNav.tsx
│   │   ├── DocumentCard.tsx
│   │   └── ExamTimer.tsx
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts
│   │   ├── ocr.ts                      # OCR.space integration
│   │   ├── openai.ts                   # GPT-4o-mini extraction
│   │   └── pdf-export.ts               # jsPDF export
│   ├── types/index.ts
│   └── middleware.ts                   # Auth middleware
├── supabase/
│   └── schema.sql                      # Complete DB schema
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 💡 Cara Kerja

1. **Upload PDF** → disimpan di Supabase Storage
2. **OCR.space API** → ekstrak teks dari PDF
3. **GPT-4o-mini** → identifikasi soal pilihan ganda, output JSON
4. **Supabase DB** → simpan questions, sessions, answers
5. **CBT Interface** → timer, navigasi, submit
6. **Results** → skor, analisis, export PDF (Basic+)
7. **Study Room** → kode unik, leaderboard real-time (Pro)

---

## 💰 Estimasi Biaya API

| Service | Free Tier | Biaya Produksi |
|---|---|---|
| Vercel | ✅ Gratis (Hobby) | - |
| Supabase | ✅ Gratis (500MB DB) | - |
| OCR.space | ✅ 500 hal/bulan | $0.006/halaman |
| OpenAI GPT-4o-mini | ❌ (bayar) | ~Rp750/dokumen |
| Midtrans | ✅ Gratis setup | Biaya sesuai metode pembayaran aktif |

---

## 🔧 Troubleshooting

**"Supabase connection error"** → Periksa `.env.local`, pastikan URL dan key benar.

**"OCR tidak akurat"** → Coba PDF dengan kualitas cetak lebih baik. OCR Engine 2 sudah diaktifkan.

**"AI tidak menemukan soal"** → Pastikan PDF memiliki soal pilihan ganda format A/B/C/D.

**"Upload gagal"** → Pastikan bucket `documents` sudah dibuat (ada di schema.sql).

---

## 📝 Lisensi

MIT — bebas digunakan untuk keperluan edukasi dan bisnis.

---

*Dibuat untuk Business Plan Competition "Zero To Cash" 2026 · HIMAMEN*
