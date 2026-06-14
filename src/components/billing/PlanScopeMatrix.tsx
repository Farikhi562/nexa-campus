import { CheckCircle2, Lock, Sparkles } from 'lucide-react'
import { BILLING_PLANS, type BillingPlanId } from '@/lib/billing/plans'
import { FEATURE_META, PLAN_LIMITS, canUseFeature, type FeatureKey } from '@/lib/billing/access'

const rows: Array<{ label: string; feature?: FeatureKey; values?: Record<BillingPlanId, string> }> = [
  { label: 'Deadline aktif', values: { radar: 'Maks 5', pulse: 'Unlimited', command: 'Unlimited' } },
  { label: 'Quick Add manual', feature: 'quick_add_manual' },
  { label: 'AI Quick Add', values: { radar: 'Preview saja', pulse: '10x/hari + save', command: '100x/hari + custom reminder' } },
  { label: 'NEXA Assistant', values: { radar: '5 chat/hari', pulse: '30 chat/hari', command: '100 chat/hari + actions' } },
  { label: 'In-app notification', feature: 'in_app_notifications' },
  { label: 'Telegram notification', feature: 'telegram_notifications' },
  { label: 'Gmail/email notification', feature: 'email_notifications' },
  { label: 'Custom reminder', values: { radar: 'H-1 & hari-H basic', pulse: 'H-1 & hari-H', command: 'H-7, H-3, H-1, hari-H, jam custom' } },
  { label: 'Weekly summary', feature: 'weekly_summary' },
  { label: 'Study Room', values: { radar: 'Join basic', pulse: 'Create + chat', command: 'Voice/video call' } },
  { label: 'Tambah teman', values: { radar: 'NEXA ID basic · max 10', pulse: 'NEXA ID full · max 100', command: 'NEXA ID + QR · unlimited fair use' } },
  { label: 'Private chat', feature: 'private_chat' },
  { label: 'NEXA Arena', values: { radar: 'View public', pulse: 'Join + badge', command: 'Create team + leaderboard' } },
  { label: 'Team leaderboard', feature: 'arena_team_leaderboard' },
  { label: 'Priority support', feature: 'priority_support' },
]

function PlanValue({ plan, row }: { plan: BillingPlanId; row: (typeof rows)[number] }) {
  if (row.values) return <span>{row.values[plan]}</span>
  if (!row.feature) return <span>-</span>

  const allowed = canUseFeature(plan, row.feature)
  return allowed ? (
    <span className="inline-flex items-center gap-2 font-black text-emerald-700">
      <CheckCircle2 className="h-4 w-4" /> Ada
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 font-black text-slate-400">
      <Lock className="h-4 w-4" /> Locked
    </span>
  )
}

export default function PlanScopeMatrix() {
  const plans = Object.keys(BILLING_PLANS) as BillingPlanId[]

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-teal-700">
            <Sparkles className="h-3.5 w-3.5" /> Scope Plan
          </div>
          <h2 className="mt-3 text-2xl font-black text-slate-950">Batasan Radar, Pulse, Command</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Radar buat coba, Pulse buat produktif harian, Command buat power user. Akhirnya pricing lu punya tulang punggung, bukan cuma angka ditempel di card.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 rounded-tl-2xl border border-slate-200 bg-slate-50 p-4 text-left font-black text-slate-700">Fitur</th>
              {plans.map((plan) => (
                <th key={plan} className="border-y border-r border-slate-200 bg-slate-50 p-4 text-left align-top first:border-l">
                  <div className="text-base font-black text-slate-950">{BILLING_PLANS[plan].name}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{BILLING_PLANS[plan].priceLabel} · {BILLING_PLANS[plan].positioning}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="sticky left-0 z-10 border-x border-b border-slate-200 bg-white p-4 font-black text-slate-800">
                  {row.label}
                  {row.feature ? <div className="mt-1 text-xs font-medium text-slate-400">{FEATURE_META[row.feature].description}</div> : null}
                </td>
                {plans.map((plan) => (
                  <td key={`${row.label}-${plan}`} className="border-b border-r border-slate-200 p-4 align-top text-slate-600">
                    <PlanValue plan={plan} row={row} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">{BILLING_PLANS[plan].name}</p>
            <p className="mt-1 text-sm text-slate-500">Assistant {PLAN_LIMITS[plan].assistantDailyLimit} chat/hari · AI Quick Add {PLAN_LIMITS[plan].aiQuickAddDailyLimit}x/hari</p>
          </div>
        ))}
      </div>
    </section>
  )
}
