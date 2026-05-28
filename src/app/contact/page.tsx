import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, ShieldCheck, Zap } from 'lucide-react'

export default function ContactPage() {
  const message = encodeURIComponent('Halo admin NEXA, saya ingin tanya paket dan aktivasi DOKU.')

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight">Kontak NEXA</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Pakai halaman ini untuk support, aktivasi paket, paket kampus, atau bantuan checkout DOKU.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a href={`https://wa.me/?text=${message}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-5 hover:border-brand-300 hover:bg-brand-50">
              <MessageCircle className="h-6 w-6 text-brand-600" />
              <h2 className="mt-4 font-black">WhatsApp Admin</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Kirim pesan otomatis untuk aktivasi paket dan pembayaran.</p>
            </a>
            <a href="mailto:support@nexa-campus.local" className="rounded-lg border border-slate-200 p-5 hover:border-brand-300 hover:bg-brand-50">
              <Mail className="h-6 w-6 text-brand-600" />
              <h2 className="mt-4 font-black">Email Support</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Ganti alamat email ini dengan email bisnis resmi sebelum launch.</p>
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" />
            <p className="text-sm leading-6 text-emerald-900">
              Untuk siap jual, pastikan nomor WhatsApp bisnis, email support, akun DOKU merchant, dan policy halaman legal sudah memakai data brand final.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
