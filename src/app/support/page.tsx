import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Gift,
  LockKeyhole,
  Radar,
  Send,
  Sparkles,
  Target,
  UserRound,
  Zap,
} from 'lucide-react'
import PublicPageShell from '@/components/layout/PublicPageShell'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { PLANS } from '@/lib/nexa-data'

export const metadata = {
  title: 'Panduan NEXA Campus',
  description:
    'Panduan memakai NEXA Campus: mulai dari profil, tambah deadline, reminder Telegram, sampai referral.',
}

const quickStart = [
  {
    icon: UserRound,
    title: 'Masuk & lengkapi profil',
    desc: 'Masuk dengan Google, lalu isi nama, kampus, jurusan, dan semester. NEXA tidak pernah meminta password kampus.',
    href: '/dashboard/settings/profile',
    cta: 'Buka profil',
  },
  {
    icon: CalendarPlus,
    title: 'Tambah deadline pertama',
    desc: 'Catat tugas, praktikum, kuis, ujian, atau pembayaran. Isi tanggal dan jam supaya urutannya jelas.',
    href: '/dashboard/deadlines/new',
    cta: 'Tambah deadline',
  },
  {
    icon: BellRing,
    title: 'Aktifkan reminder',
    desc: 'Hubungkan Telegram chat ID dan kirim pesan percobaan. Reminder otomatis tersedia mulai paket Pulse.',
    href: '/dashboard/settings/reminders',
    cta: 'Atur reminder',
  },
  {
    icon: Gift,
    title: 'Ajak teman',
    desc: 'Bagikan link referral. Setelah teman selesai onboarding, kamu mendapat 30 hari Pulse gratis.',
    href: '/dashboard',
    cta: 'Lihat link referral',
  },
]

const tierMeta: Record<
  string,
  { icon: typeof Radar; tagline: string; who: string; tone: string }
> = {
  radar: {
    icon: Radar,
    tagline: 'Gratis untuk mulai mencatat deadline dengan rapi.',
    who: 'Mahasiswa yang ingin mulai mencatat deadline tanpa setup rumit.',
    tone: 'border-slate-200',
  },
  pulse: {
    icon: Zap,
    tagline: 'Untuk yang butuh reminder otomatis.',
    who: 'Mahasiswa yang sering punya banyak deadline dan butuh pengingat.',
    tone: 'border-cyan-200',
  },
  command: {
    icon: Target,
    tagline: 'Reminder lebih detail dan akses fitur baru.',
    who: 'Pengguna yang ingin mengatur reminder lebih lengkap dan mencoba fitur baru lebih awal.',
    tone: 'border-teal-300 ring-2 ring-teal-200',
  },
}

const featureGuides = [
  {
    icon: CalendarPlus,
    title: 'Tambah & kelola deadline',
    body: 'Buka "Tambah Deadline", isi mata kuliah, jenis deadline, tanggal, dan jam. Dari dashboard kamu bisa menandai selesai, mengedit, atau menghapus deadline. Daftarnya otomatis dikelompokkan berdasarkan urgensi.',
    tiers: 'Semua paket',
  },
  {
    icon: Sparkles,
    title: 'AI Quick Add',
    body: 'Tempel teks pengumuman dari dosen atau grup WA, lalu NEXA membantu membuat draft deadline. Sebelum disimpan, hasilnya tetap bisa kamu cek dan edit.',
    tiers: 'Fitur bertahap',
  },
  {
    icon: BellRing,
    title: 'Reminder Telegram',
    body: 'Masukkan Telegram chat ID di Pengaturan → Reminder, lalu kirim pesan percobaan. Pulse mendukung pengingat H-1 dan hari-H. Command menambahkan H-7, H-3, dan pilihan jam reminder.',
    tiers: 'Mulai Pulse',
  },
  {
    icon: Gift,
    title: 'Referral / ajak teman',
    body: 'Setiap akun punya kode referral. Bagikan linknya; saat teman selesai onboarding lewat link kamu, reward Pulse akan masuk ke akunmu. Jumlah teman yang join tampil di kartu "Ajak Teman".',
    tiers: 'Semua paket',
  },
  {
    icon: UserRound,
    title: 'Profil & foto',
    body: 'Lengkapi nama, kampus (bisa ketik manual kalau belum ada di daftar), provinsi, jurusan, dan semester. Upload foto profil opsional (JPG/PNG/WebP/GIF, maks 2MB).',
    tiers: 'Semua paket',
  },
  {
    icon: CreditCard,
    title: 'Upgrade paket',
    body: 'Buka menu Billing untuk mengajukan upgrade ke Pulse atau Command. Untuk tahap awal, upgrade dikonfirmasi admin terlebih dahulu.',
    tiers: 'Semua paket',
  },
]

const referralSteps = [
  'Buka Dashboard, cari kartu "Ajak Teman".',
  'Klik "Copy Link" atau "Share WA" untuk membagikan link referral.',
  'Teman membuka link, login dengan Google, lalu menyelesaikan onboarding.',
  'Reward 30 hari NEXA Pulse masuk ke akunmu setelah proses selesai.',
]

const faqs = [
  {
    q: 'Apakah NEXA minta password kampus (VClass, iLab, Studentsite)?',
    a: 'Tidak. NEXA memakai Google OAuth dan hanya menyimpan profil serta deadline yang kamu input sendiri.',
  },
  {
    q: 'Profil gagal disimpan / muncul error "schema cache". Kenapa?',
    a: 'Biasanya karena database belum sinkron. Admin perlu menjalankan schema terbaru di Supabase SQL Editor, lalu coba simpan profil lagi.',
  },
  {
    q: 'Reward referral tidak masuk?',
    a: 'Pastikan teman menyelesaikan onboarding melalui link referral kamu. Reward diproses setelah onboarding selesai dan konfigurasi hosting sudah benar.',
  },
  {
    q: 'Apakah ini sistem resmi kampus?',
    a: 'Bukan. NEXA Campus adalah alat bantu pribadi. Selalu cek informasi final dari kanal resmi kampusmu.',
  },
]

export default function SupportPage() {
  return (
    <PublicPageShell
      badge="Panduan NEXA Campus"
      title="Cara memakai NEXA Campus dari awal."
      description="Panduan singkat untuk mencatat deadline, mengaktifkan reminder, dan memahami tiap paket yang tersedia."
      primaryCta={{ label: 'Mulai Gratis', href: '/login?mode=signup' }}
      secondaryCta={{ label: 'Buka Dashboard', href: '/dashboard' }}
    >
      {/* QUICK START */}
      <div className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <Badge tone="brand">Mulai cepat</Badge>
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">4 langkah untuk mulai memakai NEXA</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickStart.map(({ icon: Icon, title, desc, href, cta }, index) => (
            <Card key={title} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-black text-slate-200">{index + 1}</span>
                </div>
                <p className="mt-4 text-base font-black text-slate-950">{title}</p>
                <p className="mt-1.5 flex-1 text-sm leading-6 text-slate-600">{desc}</p>
                <Link
                  href={href}
                  className="focus-ring mt-4 inline-flex items-center gap-1.5 text-sm font-black text-teal-700 hover:text-teal-800"
                >
                  {cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* TIER COMPARISON */}
      <div className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <Badge tone="info">3 paket</Badge>
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">Isi tiap paket</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const meta = tierMeta[plan.id]
            const Icon = meta.icon
            return (
              <Card key={plan.id} className={`relative overflow-hidden ${meta.tone}`}>
                {plan.highlighted && (
                  <div className="absolute right-4 top-4">
                    <Badge tone="brand">Paling lengkap</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-teal-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-black text-slate-950">{plan.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{meta.tagline}</p>
                  <p className="mt-4 text-3xl font-black text-slate-950">
                    {plan.price}
                    <span className="text-sm font-semibold text-slate-500">{plan.suffix}</span>
                  </p>
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    <span className="font-black text-slate-800">Cocok untuk: </span>
                    {meta.who}
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm leading-5 text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>Mau melihat harga lengkap atau mengajukan upgrade?</p>
          <Link
            href="/pricing"
            className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
          >
            Lihat halaman pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* FEATURE GUIDES */}
      <div className="mb-12">
        <div className="mb-5 flex items-center gap-3">
          <Badge tone="brand">Panduan fitur</Badge>
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">Cara kerja fitur utama</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featureGuides.map(({ icon: Icon, title, body, tiers }) => (
            <Card key={title}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-950">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">{body}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {tiers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* REFERRAL HOW-TO */}
      <div className="mb-12">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white">
                <Gift className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-black text-slate-950">Ajak teman, dapat Pulse gratis</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Referral NEXA dibuat sederhana: bagikan link, teman join, lalu reward diproses otomatis.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-2.5 text-sm font-black text-teal-900">
                <Sparkles className="h-4 w-4" />
                +30 hari NEXA Pulse per teman
              </div>
            </div>
            <ol className="space-y-3">
              {referralSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="mb-10">
        <div className="mb-5 flex items-center gap-3">
          <Badge tone="info">FAQ</Badge>
          <h2 className="text-xl font-black text-slate-950 sm:text-2xl">Pertanyaan yang sering muncul</h2>
        </div>
        <div className="grid gap-3">
          {faqs.map(({ q, a }) => (
            <Card key={q}>
              <CardContent className="p-5">
                <h3 className="text-base font-black text-slate-950">{q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PRIVACY NOTE */}
      <div className="flex gap-3 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-sm leading-6 text-slate-300">
        <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-teal-300" />
        <p>
          NEXA Campus tidak meminta password VClass, iLab, Studentsite, atau akun kampus mana pun. Yang disimpan hanya
          profil dan deadline yang kamu input sendiri. NEXA Campus bukan sistem resmi kampus, jadi tetap cek informasi final dari
          kanal resmi.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-bold text-slate-500">Mau mulai dari yang paling sederhana?</p>
        <Link
          href="/login?mode=signup"
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
        >
          Mulai pakai NEXA
          <Send className="h-4 w-4" />
        </Link>
      </div>
    </PublicPageShell>
  )
}
