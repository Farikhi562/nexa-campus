'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  Filter,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Store,
  Tag,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/EmptyState'
import { PlanBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { validateMarketplaceListing } from '@/lib/policy'
import type { Plan, Profile } from '@/types'

type ListingType = 'barang' | 'jasa'

interface MarketplaceListing {
  id: string
  seller_id: string
  type: ListingType
  title: string
  description: string
  category: string
  price_label: string | null
  campus: string | null
  location: string | null
  contact_telegram: string | null
  status: 'draft' | 'pending' | 'active' | 'sold' | 'archived' | 'rejected'
  is_verified: boolean
  created_at: string
}

const TYPE_OPTIONS: Array<{ id: 'semua' | ListingType; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'barang', label: 'Barang' },
  { id: 'jasa', label: 'Jasa' },
]

export default function MarketplacePage() {
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<'semua' | ListingType>('semua')
  const [query, setQuery] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftType, setDraftType] = useState<ListingType>('barang')
  const [draft, setDraft] = useState({
    title: '',
    price: '',
    category: '',
    location: '',
    description: '',
  })
  const [policyAccepted, setPolicyAccepted] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const loadMarketplace = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [profileRes, listingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    if (listingsRes.error) {
      setError('Marketplace belum siap. Jalankan migration marketplace di Supabase terlebih dahulu.')
      setListings([])
    } else {
      setListings((listingsRes.data || []) as MarketplaceListing[])
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadMarketplace()
  }, [loadMarketplace])

  const plan = (profile?.plan ?? 'free') as Plan
  const canSell = plan !== 'free'

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesType = activeType === 'semua' || listing.type === activeType
      const searchable = [
        listing.title,
        listing.category,
        listing.campus,
        listing.location,
        listing.description,
      ].filter(Boolean).join(' ').toLowerCase()
      const matchesQuery = searchable.includes(query.toLowerCase().trim())
      return matchesType && matchesQuery
    })
  }, [activeType, listings, query])

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function publishListing() {
    if (!canSell || saving) return
    if (!draft.title.trim() || !draft.price.trim() || !draft.category.trim() || !draft.description.trim()) {
      setNotice('Nama, harga, kategori, dan deskripsi wajib diisi.')
      return
    }
    if (!policyAccepted) {
      setNotice('Centang persetujuan aturan marketplace sebelum menerbitkan listing.')
      return
    }

    const policyCheck = validateMarketplaceListing(`${draftType} ${draft.title} ${draft.category} ${draft.description}`)
    if (!policyCheck.ok) {
      setNotice(policyCheck.message)
      return
    }

    if (!profile?.telegram_number) {
      setNotice('Isi nomor Telegram di profil dulu supaya pembeli bisa menghubungi seller.')
      return
    }

    setSaving(true)
    setNotice('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      setNotice('Sesi login habis. Silakan login ulang.')
      return
    }

    const response = await fetch('/api/marketplace/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: draftType,
        title: draft.title.trim(),
        price_label: draft.price.trim(),
        category: draft.category.trim(),
        location: draft.location.trim() || profile.provinsi,
        description: draft.description.trim(),
      }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      setNotice(payload?.error || 'Gagal menerbitkan listing.')
      setSaving(false)
      return
    }

    setDraft({ title: '', price: '', category: '', location: '', description: '' })
    setPolicyAccepted(false)
    setShowComposer(false)
    setNotice('Listing berhasil diterbitkan.')
    setSaving(false)
    await loadMarketplace()
  }

  function contactSeller(listing: MarketplaceListing) {
    if (!listing.contact_telegram) {
      setNotice('Seller belum memasang nomor Telegram.')
      return
    }

    const digits = listing.contact_telegram.replace(/\D/g, '')
    const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
    const text = encodeURIComponent(
      `Halo, saya tertarik dengan ${listing.type} "${listing.title}" di NEXA Marketplace. Apakah masih tersedia?`
    )
    window.open(`https://t.me/${normalized}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              <Store className="h-3.5 w-3.5" />
              Marketplace Mahasiswa
            </div>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Jual beli barang kampus dan jasa mahasiswa.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Listing yang tampil di sini berasal dari user NEXA sungguhan. Kalau belum ada seller, marketplace akan tampil kosong.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-950">Status akun</p>
                <p className="mt-1 text-xs text-slate-500">Hak jual mengikuti paket aktif.</p>
              </div>
              <PlanBadge plan={plan} />
            </div>

            {canSell ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Bisa membuka lapak</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                      Akun Basic dan Pro dapat menjual barang atau jasa ke mahasiswa lain.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Mode pembeli aktif</p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Kamu bisa lihat dan hubungi seller. Upgrade ke Basic atau Pro untuk mulai jualan.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button onClick={() => setShowComposer(true)} disabled={!canSell} fullWidth>
                <Plus className="h-4 w-4" />
                Jual Barang/Jasa
              </Button>
              {!canSell && (
                <Link href="/pricing" className="inline-flex">
                  <Button variant="outline" type="button">Upgrade</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari barang, jasa, kategori, atau lokasi"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
          <Filter className="ml-2 h-4 w-4 text-slate-400" />
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveType(option.id)}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                activeType === option.id
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {(notice || error) && (
        <div className={`flex items-start gap-3 rounded-lg border p-4 ${error ? 'border-red-200 bg-red-50' : 'border-brand-200 bg-brand-50'}`}>
          {error ? (
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
          )}
          <p className={`flex-1 text-sm font-bold ${error ? 'text-red-900' : 'text-brand-950'}`}>{error || notice}</p>
          <button onClick={() => { setNotice(''); setError('') }} className="text-sm font-bold text-slate-600">Tutup</button>
        </div>
      )}

      {showComposer && (
        <section className="rounded-lg border border-brand-200 bg-white p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Buat listing baru</h2>
              <p className="mt-1 text-sm text-slate-500">Listing aktif akan tersimpan di Supabase dan tampil untuk user login.</p>
            </div>
            <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-bold">
              {(['barang', 'jasa'] as ListingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDraftType(type)}
                  className={`rounded-md px-4 py-2 capitalize ${
                    draftType === type ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input value={draft.title} onChange={(e) => updateDraft('title', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder={draftType === 'barang' ? 'Nama barang' : 'Nama jasa'} />
            <input value={draft.price} onChange={(e) => updateDraft('price', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Harga" />
            <input value={draft.category} onChange={(e) => updateDraft('category', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Kategori" />
            <input value={draft.location} onChange={(e) => updateDraft('location', e.target.value)} className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Lokasi / kampus" />
            <textarea value={draft.description} onChange={(e) => updateDraft('description', e.target.value)} className="min-h-24 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 md:col-span-2" placeholder="Deskripsi singkat, kondisi barang, metode ketemu, atau detail jasa" />
          </div>

          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700" />
              <div>
                <p className="text-sm font-black text-red-950">Aturan konten marketplace</p>
                <p className="mt-1 text-xs leading-5 text-red-800">
                  Dilarang menjual barang ilegal, narkotika, senjata, alkohol, rokok/vape untuk minor, konten dewasa, jasa joki tugas/ujian, akun, data pribadi, Dokumen palsu, produk bajakan, plagiarisme, dan penipuan.
                </p>
                <label className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-red-900">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(event) => setPolicyAccepted(event.target.checked)}
                    className="mt-1"
                  />
                  Saya memastikan listing ini tidak melanggar aturan marketplace dan bertanggung jawab atas transaksi yang saya lakukan.
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { setShowComposer(false); setPolicyAccepted(false) }}>
              Batal
            </Button>
            <Button type="button" onClick={publishListing} loading={saving} disabled={!policyAccepted}>
              Terbitkan Listing
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center md:col-span-2 xl:col-span-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <p className="mt-3 text-sm font-semibold text-slate-500">Memuat listing...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              variant="marketplace"
              title="Belum ada listing. Jadilah yang pertama jualan di sini!"
              description="Barang bekas kuliah, jasa desain, tutoring, dan kebutuhan kampus bisa kamu tawarkan ke mahasiswa lain."
              actionLabel="Buat Listing"
              onAction={() => setShowComposer(true)}
            />
          </div>
        ) : filteredListings.map((listing) => (
          <article key={listing.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${listing.type === 'barang' ? 'bg-cyan-50 text-cyan-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {listing.type === 'barang' ? <Package className="h-5 w-5" /> : <BriefcaseBusiness className="h-5 w-5" />}
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600">
                {listing.type}
              </span>
            </div>

            <h3 className="min-h-12 text-base font-black leading-6 text-slate-950">{listing.title}</h3>
            <p className="mt-2 text-xl font-black text-brand-700">{listing.price_label || 'Hubungi seller'}</p>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{listing.description}</p>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                {listing.campus || 'Kampus belum diisi'}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {listing.location || 'Lokasi belum diisi'}
              </p>
              <p className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                {listing.category}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">Seller NEXA</p>
                <p className="text-xs text-slate-500">{listing.is_verified ? 'Terverifikasi' : 'Akun seller aktif'}</p>
              </div>
              <Button size="sm" type="button" onClick={() => contactSeller(listing)} disabled={!listing.contact_telegram}>
                <MessageCircle className="h-3.5 w-3.5" />
                Hubungi
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
