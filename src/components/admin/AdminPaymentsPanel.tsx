'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, ExternalLink, Loader2, RefreshCcw, Search, XCircle } from 'lucide-react'
import { BILLING_PLANS, rupiah, type PaidBillingPlanId } from '@/lib/billing/plans'

type PaymentStatus = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'cancelled'

type UserProfile = {
  id?: string
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  plan?: string | null
  plan_status?: string | null
  plan_expires_at?: string | null
}

type ManualPaymentOrder = {
  id: string
  order_code: string
  user_id: string
  plan: PaidBillingPlanId
  amount: number
  status: Exclude<PaymentStatus, 'all'>
  payment_method?: string | null
  bank_name?: string | null
  account_number?: string | null
  account_name?: string | null
  buyer_name?: string | null
  buyer_whatsapp?: string | null
  proof_url?: string | null
  notes?: string | null
  rejection_reason?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
  expires_at?: string | null
  approved_at?: string | null
  user_profile?: UserProfile | null
}

type ApiResponse = {
  orders?: ManualPaymentOrder[]
  stats?: {
    total: number
    amount: number
    by_status: Record<string, number>
  }
  error?: string
}

const STATUS_OPTIONS: PaymentStatus[] = ['all', 'pending', 'under_review', 'approved', 'rejected', 'expired', 'cancelled']

const STATUS_LABEL: Record<PaymentStatus, string> = {
  all: 'Semua',
  pending: 'Pending',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusClass(status: string) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'rejected') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'under_review') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (status === 'expired' || status === 'cancelled') return 'bg-slate-100 text-slate-500 border-slate-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

function userName(order: ManualPaymentOrder) {
  return order.user_profile?.full_name || order.buyer_name || order.user_profile?.email || order.user_id.slice(0, 8)
}

export default function AdminPaymentsPanel() {
  const [orders, setOrders] = useState<ManualPaymentOrder[]>([])
  const [status, setStatus] = useState<PaymentStatus>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadOrders(nextStatus = status) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/billing/manual-payment?status=${encodeURIComponent(nextStatus)}`, {
        cache: 'no-store',
      })
      const data = (await response.json().catch(() => null)) as ApiResponse | null
      if (!response.ok) throw new Error(data?.error || 'Gagal load payment orders.')
      setOrders(data?.orders ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal load payment orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((order) => {
      const haystack = [
        order.order_code,
        order.plan,
        order.status,
        order.payment_method,
        order.bank_name,
        order.buyer_name,
        order.buyer_whatsapp,
        order.user_profile?.full_name,
        order.user_profile?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [orders, search])

  const stats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1
        acc.amount += order.amount || 0
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      },
      { total: 0, amount: 0 } as Record<string, number>,
    )
  }, [orders])

  async function processOrder(order: ManualPaymentOrder, nextStatus: 'approved' | 'rejected') {
    const rejectionReason =
      nextStatus === 'rejected'
        ? window.prompt('Alasan reject pembayaran?', 'Bukti pembayaran belum valid / nominal belum sesuai.')
        : null

    if (nextStatus === 'rejected' && rejectionReason === null) return

    if (nextStatus === 'approved') {
      const ok = window.confirm(`Approve ${order.order_code} (${BILLING_PLANS[order.plan]?.name || order.plan})? Plan user langsung aktif 30 hari.`)
      if (!ok) return
    }

    setActingId(order.id)
    setError(null)
    try {
      const response = await fetch('/api/admin/billing/manual-payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          status: nextStatus,
          rejection_reason: rejectionReason,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Gagal proses order.')
      await loadOrders(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal proses order.')
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-700">Admin Billing</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Manual Payment Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Approve pembayaran Pulse/Command dari Bank Jago dan BRI QRIS. Akhirnya admin nggak perlu ritual Postman kayak dukun endpoint.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadOrders(status)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400">Total order</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{stats.total || 0}</p>
          </div>
          <div className="rounded-3xl bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-700">Pending</p>
            <p className="mt-1 text-2xl font-black text-amber-800">{(stats.pending || 0) + (stats.under_review || 0)}</p>
          </div>
          <div className="rounded-3xl bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-700">Approved</p>
            <p className="mt-1 text-2xl font-black text-emerald-800">{stats.approved || 0}</p>
          </div>
          <div className="rounded-3xl bg-teal-50 p-4">
            <p className="text-xs font-bold text-teal-700">Nominal list</p>
            <p className="mt-1 text-2xl font-black text-teal-800">{rupiah(stats.amount || 0)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                  status === item ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {STATUS_LABEL[item]}
              </button>
            ))}
          </div>
          <div className="relative min-w-0 lg:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari order/nama/WA..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold outline-none transition focus:border-teal-400 focus:bg-white"
            />
          </div>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div> : null}

        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
          <div className="hidden grid-cols-[1.1fr_0.9fr_0.9fr_0.8fr_0.8fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400 lg:grid">
            <div>User / Order</div>
            <div>Plan</div>
            <div>Metode</div>
            <div>Status</div>
            <div>Bukti</div>
            <div>Aksi</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm font-black text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading pembayaran...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-500">Belum ada order di filter ini. Sepi kayak grup tugas pas pembagian kerja.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((order) => {
                const canAct = order.status === 'pending' || order.status === 'under_review'
                const acting = actingId === order.id
                const plan = BILLING_PLANS[order.plan]
                return (
                  <div key={order.id} className="grid gap-3 p-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.8fr_0.8fr_1fr] lg:items-center">
                    <div>
                      <p className="font-black text-slate-950">{userName(order)}</p>
                      <p className="mt-1 font-mono text-xs font-bold text-slate-500">{order.order_code}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDate(order.created_at)}</p>
                      {order.user_profile?.email ? <p className="mt-1 text-xs font-bold text-slate-500">{order.user_profile.email}</p> : null}
                    </div>

                    <div>
                      <p className="font-black text-slate-950">{plan?.name || order.plan}</p>
                      <p className="text-sm font-black text-teal-700">{rupiah(order.amount)}</p>
                      <p className="text-xs text-slate-400">Expired: {formatDate(order.expires_at)}</p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-700">{order.bank_name || order.payment_method}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">{order.account_number}</p>
                      {order.buyer_whatsapp ? <p className="mt-1 text-xs font-bold text-slate-500">WA: {order.buyer_whatsapp}</p> : null}
                    </div>

                    <div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusClass(order.status)}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                      {order.rejection_reason ? <p className="mt-2 text-xs font-bold text-red-600">{order.rejection_reason}</p> : null}
                    </div>

                    <div>
                      {order.proof_url ? (
                        <a
                          href={order.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                        >
                          Lihat bukti <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Belum upload</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!canAct || acting}
                        onClick={() => processOrder(order, 'approved')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={!canAct || acting}
                        onClick={() => processOrder(order, 'rejected')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                      {order.status === 'under_review' ? (
                        <span className="inline-flex items-center gap-1 rounded-2xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">
                          <Clock className="h-3.5 w-3.5" /> Cek bukti
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
