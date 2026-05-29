import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasPaidAccess } from '@/lib/plans'
import { validateMarketplaceListing } from '@/lib/policy'
import { checkRateLimit } from '@/lib/server-security'
import type { Plan } from '@/types'

export const dynamic = 'force-dynamic'

type ListingType = 'barang' | 'jasa'

function cleanText(value: unknown, max: number) {
  return String(value || '').trim().slice(0, max)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = checkRateLimit(`marketplace:create:${user.id}`, 10, 60 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Terlalu banyak listing dibuat. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const type = body.type === 'jasa' ? 'jasa' : body.type === 'barang' ? 'barang' : null
    if (!type) {
      return NextResponse.json({ error: 'Tipe listing tidak valid.' }, { status: 400 })
    }

    const title = cleanText(body.title, 120)
    const priceLabel = cleanText(body.price_label, 60)
    const category = cleanText(body.category, 80)
    const location = cleanText(body.location, 120)
    const description = cleanText(body.description, 1200)

    if (!title || !priceLabel || !category || !description) {
      return NextResponse.json({ error: 'Nama, harga, kategori, dan deskripsi wajib diisi.' }, { status: 400 })
    }

    const policyCheck = validateMarketplaceListing(`${type} ${title} ${priceLabel} ${category} ${description}`)
    if (!policyCheck.ok) {
      return NextResponse.json({ error: policyCheck.message }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('plan, telegram_number, universitas, provinsi')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!hasPaidAccess((profile?.plan ?? 'free') as Plan)) {
      return NextResponse.json({ error: 'Seller marketplace hanya untuk Basic, Pro, atau Admin.' }, { status: 403 })
    }

    if (!profile?.telegram_number) {
      return NextResponse.json({ error: 'Isi Telegram di profil dulu supaya pembeli bisa menghubungi seller.' }, { status: 400 })
    }

    const { data, error } = await service
      .from('marketplace_listings')
      .insert({
        seller_id: user.id,
        type: type as ListingType,
        title,
        price_label: priceLabel,
        category,
        location: location || profile.provinsi,
        campus: profile.universitas,
        description,
        contact_telegram: profile.telegram_number,
        status: 'active',
        is_verified: false,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ listing: data }, { status: 201 })
  } catch (error) {
    console.error('[Marketplace create] Error:', error)
    return NextResponse.json({ error: 'Gagal membuat listing.' }, { status: 500 })
  }
}
