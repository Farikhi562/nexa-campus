import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import PublicPageShell from '@/components/layout/PublicPageShell'
import { Card, CardContent } from '@/components/ui/Card'

const TERMS = [
  'NEXA Campus bukan platform resmi universitas atau kampus mana pun.',
  'User wajib memverifikasi informasi akademik final melalui kanal resmi kampus.',
  'Reminder dapat gagal karena provider, jaringan, konfigurasi bot, atau gangguan sistem.',
  'User bertanggung jawab atas akurasi data deadline yang dimasukkan.',
  'NEXA menghormati aturan kampus dan hukum yang berlaku di Indonesia.',
  'Fitur roadmap seperti WhatsApp Wablas, AI Quick Add, dan Ask NEXA belum dianggap fitur produksi sampai diumumkan resmi.',
]

export default function TermsPage() {
  return (
    <PublicPageShell
      badge="Terms of Service"
      title="Aturan main yang singkat, jelas, dan fair."
      description="Dengan menggunakan NEXA Campus, user memahami bahwa produk ini adalah alat bantu pribadi untuk mencatat dan mengingat deadline."
      primaryCta={{ label: 'Mulai Pakai NEXA', href: '/login?mode=signup' }}
      secondaryCta={{ label: 'Baca Privacy', href: '/privacy' }}
    >
      <Card className="border-slate-200 bg-white">
        <CardContent>
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <h2 className="font-black text-slate-950">Poin penting</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                NEXA membantu mengelola deadline, tapi informasi akademik final tetap dari kanal
                resmi kampus.
              </p>
            </div>
          </div>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {TERMS.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PublicPageShell>
  )
}
