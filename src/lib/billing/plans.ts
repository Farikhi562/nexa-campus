export type BillingPlanId = 'radar' | 'pulse' | 'command'
export type PaidBillingPlanId = Exclude<BillingPlanId, 'radar'>
export type ManualPaymentMethodId = 'bank_jago' | 'bri_qris'

export type BillingPlan = {
  id: BillingPlanId
  name: string
  price: number
  priceLabel: string
  period: string
  description: string
  features: string[]
  cta: string
}

export type ManualPaymentMethod = {
  id: ManualPaymentMethodId
  label: string
  shortLabel: string
  type: 'bank_transfer' | 'qris'
  bankName: string
  accountNumber: string
  accountName: string
  instruction: string
  qrImageUrl?: string
}

export const BILLING_PLANS: Record<BillingPlanId, BillingPlan> = {
  radar: {
    id: 'radar',
    name: 'NEXA Radar',
    price: 0,
    priceLabel: 'Gratis',
    period: 'selamanya',
    description: 'Mode basic buat mahasiswa yang masih sok kuat ngatur deadline manual.',
    features: [
      'Dashboard basic',
      'Deadline aktif terbatas',
      'Quick add manual',
      'Countdown deadline',
    ],
    cta: 'Pakai Radar',
  },
  pulse: {
    id: 'pulse',
    name: 'NEXA Pulse',
    price: 18000,
    priceLabel: 'Rp18.000',
    period: 'per bulan',
    description: 'Buat user yang butuh reminder lebih niat tanpa dompet langsung nangis darah.',
    features: [
      'Unlimited deadline',
      'Reminder H-1 dan hari-H',
      'Weekly summary',
      'Kategori deadline lengkap',
      'Telegram / WhatsApp reminder sesuai konfigurasi',
    ],
    cta: 'Upgrade Pulse',
  },
  command: {
    id: 'command',
    name: 'NEXA Command',
    price: 30000,
    priceLabel: 'Rp30.000',
    period: 'per bulan',
    description: 'Mode paling niat. Cocok buat manusia yang deadline-nya udah kayak cicilan dosa.',
    features: [
      'Semua fitur Pulse',
      'Custom reminder H-7 / H-3 / H-1 / hari-H',
      'Custom reminder time',
      'Preview AI Quick Add / Ask NEXA',
      'Founding beta access',
    ],
    cta: 'Upgrade Command',
  },
}

export const PAID_PLANS: PaidBillingPlanId[] = ['pulse', 'command']

export const MANUAL_PAYMENT = {
  confirmationWhatsapp: process.env.NEXT_PUBLIC_NEXA_PAYMENT_WHATSAPP || '',
}

export const MANUAL_PAYMENT_METHODS: Record<ManualPaymentMethodId, ManualPaymentMethod> = {
  bank_jago: {
    id: 'bank_jago',
    label: 'Bank Jago Transfer',
    shortLabel: 'Bank Jago',
    type: 'bank_transfer',
    bankName: process.env.NEXT_PUBLIC_BANK_JAGO_NAME || 'Bank Jago',
    accountNumber: process.env.NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NUMBER || '100157134050',
    accountName: process.env.NEXT_PUBLIC_BANK_JAGO_ACCOUNT_NAME || 'Muhamad Fauzan Al Farikhi',
    instruction: 'Transfer manual ke rekening Bank Jago, lalu kirim bukti pembayaran ke admin.',
  },
  bri_qris: {
    id: 'bri_qris',
    label: 'BRI QRIS / BRImo',
    shortLabel: 'BRI QRIS',
    type: 'qris',
    bankName: process.env.NEXT_PUBLIC_BRI_QRIS_BANK_NAME || 'BRI QRIS / BRImo',
    accountNumber: process.env.NEXT_PUBLIC_BRI_QRIS_NUMBER || '0335 0110 7723 508',
    accountName: process.env.NEXT_PUBLIC_BRI_QRIS_ACCOUNT_NAME || 'Muhamad Fauzan Al Farikhi',
    instruction: 'Scan QR BRI/BRImo, bayar sesuai nominal order, lalu kirim bukti pembayaran ke admin.',
    qrImageUrl: process.env.NEXT_PUBLIC_BRI_QRIS_IMAGE_URL || '/payment/bri-qris.jpg',
  },
}

export function isPaidPlan(plan: unknown): plan is PaidBillingPlanId {
  return plan === 'pulse' || plan === 'command'
}

export function isManualPaymentMethod(method: unknown): method is ManualPaymentMethodId {
  return method === 'bank_jago' || method === 'bri_qris'
}

export function getManualPaymentMethod(method: ManualPaymentMethodId): ManualPaymentMethod {
  return MANUAL_PAYMENT_METHODS[method]
}

export function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function buildOrderCode() {
  const timePart = Date.now().toString(36).toUpperCase()
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `NEXA-${timePart}-${randomPart}`
}
