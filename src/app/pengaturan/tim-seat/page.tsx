'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, UserPlus, Users } from 'lucide-react'
import Button from '@/components/ui/Button'

type Seat = {
  id: string
  email: string
  full_name: string | null
}

export default function TeamSeatSettingsPage() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function fetchSeats() {
    setLoading(true)
    const response = await fetch('/api/team-seats')
    const data = await response.json()
    setSeats(Array.isArray(data.data) ? data.data : [])
    setLoading(false)
  }

  useEffect(() => { fetchSeats() }, [])

  async function invite() {
    if (!email.trim() || saving) return
    setSaving(true)
    const response = await fetch('/api/team-seats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await response.json()
    setSaving(false)
    if (data.error) {
      alert(data.error)
      return
    }
    setEmail('')
    fetchSeats()
  }

  async function revoke(id: string) {
    const response = await fetch('/api/team-seats', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await response.json()
    if (data.error) alert(data.error)
    fetchSeats()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke pengaturan
        </Link>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">Team Seat Pro</h1>
              <p className="text-sm text-slate-500">Invite maksimal 3 orang untuk memakai fitur Pro dari workspace kamu.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email anggota" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500" />
            <Button onClick={invite} loading={saving} disabled={!email.trim() || seats.length >= 3}>
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-black text-slate-950">Seat aktif ({seats.length}/3)</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Memuat seat...</p>
          ) : seats.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Belum ada seat aktif.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {seats.map((seat) => (
                <div key={seat.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-black text-slate-950">{seat.full_name || seat.email}</p>
                    <p className="text-sm text-slate-500">{seat.email}</p>
                  </div>
                  <button onClick={() => revoke(seat.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Cabut akses">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
