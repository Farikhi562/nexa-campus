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
  positioning: string
  features: string[]
  locked?: string[]
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
    positioning: 'Basic survival',
    description: 'Buat user baru yang mau ngerapihin deadline tanpa langsung bayar. Gratis, tapi jangan berharap AI kerja rodi selamanya.',
    features: [
      'Dashboard akademik basic',
      'Maksimal 5 deadline aktif',
      'Quick Add manual',
      'In-app notification basic',
      'Reminder default H-1 dan hari-H',
      'NEXA Assistant 5 chat/hari',
      'Preview AI parse deadline saja',
      'Cari teman by nama/NEXA ID basic',
      'Maksimal 10 teman',
      'Join Study Room basic',
      'View NEXA Arena public',
      'Badge basic',
    ],
    locked: [
      'Telegram notification',
      'Gmail/email notification',
      'AI Quick Add save deadline',
      'Custom reminder',
      'Voice/video call Study Room',
      'QR code tambah teman',
      'Team leaderboard Arena',
    ],
    cta: 'Pakai Radar',
  },
  pulse: {
    id: 'pulse',
    name: 'NEXA Pulse',
    price: 18000,
    priceLabel: 'Rp18.000',
    period: 'per bulan',
    positioning: 'Produktif harian',
    description: 'Buat mahasiswa yang butuh reminder beneran, deadline unlimited, Telegram, dan weekly summary. Hidup masih chaos, tapi minimal ada satpam deadline.',
    features: [
      'Semua fitur Radar',
      'Unlimited deadline aktif',
      'AI Quick Add 10x/hari',
      'NEXA Assistant 30 chat/hari',
      'Assistant bisa parse dan save deadline',
      'In-app notification full',
      'Telegram reminder',
      'Reminder H-1 dan hari-H',
      'Weekly summary via Telegram/in-app',
      'Tambah teman via NEXA ID full',
      'Maksimal 100 teman',
      'Create/join Study Room',
      'Private chat basic',
      'Join NEXA Arena',
      'Lihat leaderboard',
      'Earn badge kompetisi',
    ],
    locked: [
      'Gmail/email notification',
      'Custom reminder H-7/H-3/jam custom',
      'Voice/video call Study Room',
      'QR code tambah teman',
      'Create team Arena advanced',
      'Team leaderboard management',
    ],
    cta: 'Upgrade Pulse',
  },
  command: {
    id: 'command',
    name: 'NEXA Command',
    price: 30000,
    priceLabel: 'Rp30.000',
    period: 'per bulan',
    positioning: 'Power user / tim / lomba',
    description: 'Mode paling niat. Buat user yang mau NEXA jadi asisten akademik, bukan website pajangan pakai gradient doang.',
    features: [
      'Semua fitur Pulse',
      'AI Quick Add 100x/hari / fair use',
      'NEXA Assistant 100 chat/hari',
      'Assistant full action: deadline, jadwal, reminder, summary',
      'Custom reminder H-7, H-3, H-1, hari-H, jam custom',
      'Telegram advanced notification',
      'Gmail/email notification',
      'Weekly summary Telegram + Gmail',
      'Study Room voice/video call',
      'Tambah teman via NEXA ID + QR code',
      'Unlimited friends fair use',
      'NEXA Arena full',
      'Create team',
      'Team leaderboard',
      'Badge kompetisi eksklusif',
      'Priority support',
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
    instruction: 'Transfer manual ke rekening Bank Jago, lalu upload bukti pembayaran.',
  },
  bri_qris: {
    id: 'bri_qris',
    label: 'BRI QRIS / BRImo',
    shortLabel: 'BRI QRIS',
    type: 'qris',
    bankName: process.env.NEXT_PUBLIC_BRI_QRIS_BANK_NAME || 'BRI QRIS / BRImo',
    accountNumber: process.env.NEXT_PUBLIC_BRI_QRIS_NUMBER || '0335 0110 7723 508',
    accountName: process.env.NEXT_PUBLIC_BRI_QRIS_ACCOUNT_NAME || 'Muhamad Fauzan Al Farikhi',
    instruction: 'Scan QR BRI/BRImo, bayar sesuai nominal order, lalu upload bukti pembayaran.',
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

export function normalizePlan(plan?: string | null): BillingPlanId {
  if (plan === 'pulse' || plan === 'command') return plan
  return 'radar'
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
