'use client'

import { useEffect, useMemo, useState } from 'react'
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
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { PlanBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import type { Plan, Profile } from '@/types'

type ListingType = 'barang' | 'jasa'

interface MarketplaceListing {
  id: string
  type: ListingType
  title: string
  price: string
  seller: string
  campus: string
  location: string
  category: string
  description: string
  badge?: string
  verifiedSeller: boolean
}

const LISTINGS: MarketplaceListing[] = [
  {
    id: '1',
    type: 'jasa',
    title: 'Tutor Kalkulus 1 menjelang UTS',
    price: 'Rp35.000/jam',
    seller: 'Raka Pratama',
    campus: 'Universitas Indonesia',
    location: 'Depok',
    category: 'Tutor',
    description: 'Review konsep limit, turunan, integral dasar, plus latihan soal tahun lalu.',
    badge: 'Bisa online',
    verifiedSeller: true,
  },
  {
    id: '2',
    type: 'barang',
    title: 'Buku Statistika Bisnis edisi terbaru',
    price: 'Rp78.000',
    seller: 'Nadia Putri',
    campus: 'Universitas Brawijaya',
    location: 'Malang',
    category: 'Buku',
    description: 'Kondisi 90%, ada highlight rapi di beberapa bab penting.',
    verifiedSeller: true,
  },
  {
    id: '3',
    type: 'jasa',
    title: 'Desain slide presentasi seminar',
    price: 'Mulai Rp50.000',
    seller: 'Dimas Arya',
    campus: 'ITB',
    location: 'Bandung',
    category: 'Desain',
    description: 'Deck 10-20 slide, layout akademik, grafik rapi, revisi ringan termasuk.',
    badge: 'Fast response',
    verifiedSeller: true,
  },
  {
    id: '4',
    type: 'barang',
    title: 'Kalkulator scientific Casio fx-991',
    price: 'Rp145.000',
    seller: 'Maya Sari',
    campus: 'Universitas Gadjah Mada',
    location: 'Yogyakarta',
    category: 'Alat Kuliah',
    description: 'Normal, tombol masih empuk, cocok untuk statistik dan teknik.',
    verifiedSeller: false,
  },
  {
    id: '5',
    type: 'jasa',
    title: 'Proofread laporan praktikum',
    price: 'Rp20.000/10 halaman',
    seller: 'Salsa Kirana',
    campus: 'Universitas Diponegoro',
    location: 'Semarang',
    category: 'Akademik',
    description: 'Cek typo, struktur kalimat, format sitasi, dan konsistensi tabel.',
    verifiedSeller: true,
  },
  {
    id: '6',
    type: 'barang',
    title: 'Jaket lab putih ukuran L',
    price: 'Rp55.000',
    seller: 'Fajar Nugroho',
    campus: 'Universitas Airlangga',
    location: 'Surabaya',
    category: 'Perlengkapan',
    description: 'Jarang dipakai, bersih, cocok untuk praktikum biologi atau kimia.',
    badge: 'COD kampus',
    verifiedSeller: false,
  },
]

const TYPE_OPTIONS: Array<{ id: 'semua' | ListingType; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'barang', label: 'Barang' },
  { id: 'jasa', label: 'Jasa' },
]

export default function MarketplacePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [listings, setListings] = useState<MarketplaceListing[]>(LISTINGS)
  const [activeType, setActiveType] = useState<'semua' | ListingType>('semua')
  const [query, setQuery] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [draftType, setDraftType] = useState<ListingType>('barang')
  const [draft, setDraft] = useState({
    title: '',
    price: '',
    category: '',
    location: '',
    description: '',
  })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data as Profile)
    }

    loadProfile()
  }, [supabase])

  const plan = (profile?.plan ?? 'free') as Plan
  const canSell = plan !== 'free'

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesType = activeType === 'semua' || listing.type === activeType
      const searchable = `${listing.title} ${listing.category} ${listing.campus} ${listing.location}`.toLowerCase()
      const matchesQuery = searchable.includes(query.toLowerCase().trim())
      return matchesType && matchesQuery
    })
  }, [activeType, listings, query])

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function publishListing() {
    if (!draft.title.trim() || !draft.price.trim() || !draft.category.trim()) {
      setNotice('Nama, harga, dan kategori wajib diisi.')
      return
    }

    const newListing: MarketplaceListing = {
      id: `local-${Date.now()}`,
      type: draftType,
      title: draft.title.trim(),
      price: draft.price.trim(),
      seller: profile?.full_name || 'Seller NEXA',
      campus: profile?.universitas || 'Kampus belum diisi',
      location: draft.location.trim() || profile?.provinsi || 'Lokasi belum diisi',
      category: draft.category.trim(),
      description: draft.description.trim() || 'Seller belum menambahkan deskripsi detail.',
      badge: 'Listing baru',
      verifiedSeller: true,
    }

    setListings((current) => [newListing, ...current])
    setDraft({ title: '', price: '', category: '', location: '', description: '' })
    setShowComposer(false)
    setNotice('Listing berhasil diterbitkan di sesi ini. Setelah backend marketplace aktif, listing akan tersimpan permanen.')
  }

  function contactSeller(listing: MarketplaceListing) {
    const text = encodeURIComponent(
      `Halo ${listing.seller}, saya tertarik dengan ${listing.type} "${listing.title}" di NEXA Marketplace. Apakah masih tersedia?`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
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
              Jual beli barang kampus dan jasa mahasiswa dalam ekosistem NEXA.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Cari buku bekas, perlengkapan praktikum, tutor, desain slide, proofreading, sampai bantuan akademik ringan dari mahasiswa terverifikasi.
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
              <Button
                onClick={() => setShowComposer(true)}
                disabled={!canSell}
                fullWidth
              >
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
            placeholder="Cari buku, tutor, kalkulator, desain slide..."
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

      {notice && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-700" />
          <div className="flex-1">
            <p className="text-sm font-bold text-brand-950">{notice}</p>
          </div>
          <button onClick={() => setNotice('')} className="text-sm font-bold text-brand-700">Tutup</button>
        </div>
      )}

      {showComposer && (
        <section className={`rounded-lg border p-5 ${canSell ? 'border-brand-200 bg-white' : 'border-amber-200 bg-amber-50'}`}>
          {canSell ? (
            <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Buat listing baru</h2>
                  <p className="mt-1 text-sm text-slate-500">Listing langsung tampil di marketplace. Data permanen aktif setelah backend marketplace disambungkan.</p>
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

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Listing lokal bisa langsung dilihat user selama sesi berjalan.
                </p>
                <Button type="button" onClick={publishListing}>
                  Terbitkan Listing
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h2 className="text-base font-black text-amber-950">Fitur jualan terkunci</h2>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Akun gratis hanya bisa melihat dan menghubungi seller. Upgrade ke paket berbayar untuk membuka lapak.
                  </p>
                </div>
              </div>
              <Link href="/pricing">
                <Button type="button">Lihat Paket</Button>
              </Link>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredListings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center md:col-span-2 xl:col-span-3">
            <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-bold text-slate-700">Listing tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Coba kata kunci lain atau ubah filter barang/jasa.</p>
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
            <p className="mt-2 text-xl font-black text-brand-700">{listing.price}</p>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{listing.description}</p>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                {listing.campus}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {listing.location}
              </p>
              <p className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                {listing.category}
                {listing.badge && <span className="rounded-full bg-brand-50 px-2 py-0.5 font-bold text-brand-700">{listing.badge}</span>}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{listing.seller}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  {listing.verifiedSeller && <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
                  {listing.verifiedSeller ? 'Seller berbayar' : 'Seller kampus'}
                </p>
              </div>
              <Button size="sm" type="button" onClick={() => contactSeller(listing)}>
                <MessageCircle className="h-3.5 w-3.5" />
                Hubungi
              </Button>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 flex-shrink-0 text-brand-600" />
            <div>
              <h2 className="text-base font-black text-slate-950">Aturan singkat marketplace</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Barang dan jasa harus relevan untuk kebutuhan mahasiswa. Untuk MVP, kontak seller memakai WhatsApp share dan listing baru tampil lokal. Penyimpanan permanen memakai tabel marketplace Supabase saat backend diaktifkan.
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button variant="outline" type="button">
              Bandingkan Paket
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
