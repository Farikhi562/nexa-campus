'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function DeleteAccountDangerZone({ email }: { email?: string | null }) {
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function deleteAccount() {
    setError('')
    if (confirmText.trim().toUpperCase() !== 'HAPUS AKUN') {
      setError('Ketik HAPUS AKUN dulu biar jelas ini bukan kepencet. Kita bukan sedang hapus chat kosong, ini akun beneran.')
      return
    }
    const ok = window.confirm('Akun kamu akan dihapus permanen dari NEXA Campus. Data profil, pertemanan, chat, dan aktivitas akan dibersihkan sejauh database mengizinkan. Lanjut?')
    if (!ok) return

    setLoading(true)
    const res = await fetch('/api/account/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmation: confirmText }),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Akun gagal dihapus. Coba lagi sebentar.')
      return
    }

    window.location.href = '/login?deleted=account'
  }

  return (
    <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-wide text-red-700">Danger zone</p>
          <h2 className="mt-1 text-lg font-black text-red-950">Hapus akun mandiri</h2>
          <p className="mt-1 text-sm leading-6 text-red-800">
            Ini akan menghapus akun NEXA Campus untuk {email ? <span className="font-black">{email}</span> : 'akun ini'}.
            Data sosial seperti pertemanan, pesan, profil, dan aktivitas akan dibersihkan dari tabel utama. Keputusan permanen, jadi jangan lakukan ini cuma karena error lagi bete. 🫠
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="Ketik: HAPUS AKUN"
              className="focus-ring w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-950 placeholder:text-red-300"
            />
            <Button type="button" onClick={deleteAccount} disabled={loading} className="rounded-2xl bg-red-600 hover:bg-red-700">
              {loading ? 'Menghapus...' : 'Hapus Akun'}
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-red-700 ring-1 ring-red-200">{error}</p>}
        </div>
      </div>
    </section>
  )
}
