"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NimVerification() {
  const [nim, setNim] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/user/verify-nim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nim }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="bg-orange-100 border border-orange-200 p-4 rounded-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-orange-800 font-semibold text-sm">Status: NPM Belum Terverifikasi</h2>
          <p className="text-orange-600 text-xs mt-1">Sistem butuh validasi NPM UG (8 digit). Tanpa NPM, akses dibatasi.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={nim}
            // Batasi input hanya angka & maksimal 8 digit
            onChange={(e) => setNim(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="Masukkan 8 digit NPM"
            className="px-3 py-2 border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-48 text-slate-900"
            required
          />
          <button 
            type="submit" 
            disabled={loading || nim.length !== 8}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Verifikasi"}
          </button>
        </form>
      </div>
      {error && <p className="text-red-600 text-xs mt-2 font-medium">{error}</p>}
    </div>
  )
}