import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, ShieldCheck, Zap } from 'lucide-react'

export default function ContactPage() {
  const adminTelegram = (process.env.NEXT_PUBLIC_ADMIN_TELEGRAM || 'NEXATchBot').replace(/^@/, '')
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'nexatechlabs271@gmail.com'
  const message = encodeURIComponent('Halo admin NEXA, saya ingin tanya support, aktivasi paket, paket kampus, atau bantuan checkout Midtrans.')
  const telegramHref = adminTelegram ? `https://t.me/${adminTelegram}?start=${message}` : ''
  const mailHref = supportEmail ? `mailto:${supportEmail}` : ''

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
            Halaman ini dipakai untuk support, aktivasi paket, paket kampus, dan bantuan checkout Midtrans.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a href={telegramHref || undefined} target="_blank" rel="noreferrer" className={`rounded-lg border border-slate-200 p-5 ${telegramHref ? 'hover:border-brand-300 hover:bg-brand-50' : 'pointer-events-none opacity-60'}`}>
              <MessageCircle className="h-6 w-6 text-brand-600" />
              <h2 className="mt-4 font-black">Telegram Admin</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {telegramHref ? `@${adminTelegram}` : 'Telegram admin belum dikonfigurasi.'}
              </p>
            </a>
            <a href={mailHref || undefined} className={`rounded-lg border border-slate-200 p-5 ${mailHref ? 'hover:border-brand-300 hover:bg-brand-50' : 'pointer-events-none opacity-60'}`}>
              <Mail className="h-6 w-6 text-brand-600" />
              <h2 className="mt-4 font-black">Email Support</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mailHref ? supportEmail : 'Email support belum dikonfigurasi.'}
              </p>
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" />
            <p className="text-sm leading-6 text-emerald-900">
              Gunakan kontak resmi ini untuk bantuan akun, aktivasi pembayaran Midtrans, kerja sama paket kampus, dan permintaan penghapusan akun atau data.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
