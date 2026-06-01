import type { DeadlinePriority, DeadlineSource, DeadlineType, Plan } from '@/types'

export const PLAN_LABELS: Record<Plan, string> = {
  radar: 'NEXA Radar',
  pulse: 'NEXA Pulse',
  command: 'NEXA Command',
}

export const PLANS = [
  {
    id: 'radar',
    name: PLAN_LABELS.radar,
    price: 'Rp0',
    suffix: '',
    positioning: 'Buat mulai rapi.',
    features: [
      'Maksimal 5 active deadlines',
      'Dashboard basic',
      'Countdown deadline',
      'Manual input deadline',
      'AI Quick Add locked preview',
    ],
    highlighted: false,
  },
  {
    id: 'pulse',
    name: PLAN_LABELS.pulse,
    price: 'Rp15.000',
    suffix: '/bulan',
    positioning: 'Buat deadline yang harus ngejar kamu.',
    features: [
      'Unlimited deadlines',
      'Reminder H-1 dan hari-H',
      'Weekly summary',
      'Kategori deadline lengkap',
      'Basic priority',
      'AI Quick Add locked preview',
    ],
    highlighted: false,
  },
  {
    id: 'command',
    name: PLAN_LABELS.command,
    price: 'Rp25.000',
    suffix: '/bulan',
    positioning: 'Buat kontrol penuh sebelum tugas menguasai hidupmu.',
    features: [
      'Semua fitur Pulse',
      'Custom reminder H-7, H-3, H-1, hari-H',
      'Custom reminder time',
      'AI Quick Add locked preview',
      'Ask NEXA locked preview',
      'Beta feature access',
    ],
    highlighted: true,
  },
] as const

export const DEADLINE_TYPES: Array<{ value: DeadlineType; label: string }> = [
  { value: 'tugas', label: 'Tugas' },
  { value: 'praktikum', label: 'Praktikum' },
  { value: 'kuis', label: 'Kuis' },
  { value: 'ujian', label: 'Ujian' },
  { value: 'presentasi', label: 'Presentasi' },
  { value: 'administrasi', label: 'Administrasi' },
  { value: 'pembayaran', label: 'Pembayaran' },
  { value: 'organisasi', label: 'Organisasi' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const DEADLINE_SOURCES: Array<{ value: DeadlineSource; label: string }> = [
  { value: 'vclass', label: 'VClass' },
  { value: 'ilab', label: 'iLab' },
  { value: 'dosen_langsung', label: 'Dosen langsung' },
  { value: 'grup_wa', label: 'Grup WA' },
  { value: 'praktikum', label: 'Praktikum' },
  { value: 'studentsite', label: 'Studentsite' },
  { value: 'baak', label: 'BAAK' },
  { value: 'lepkom', label: 'Lepkom' },
  { value: 'lainnya', label: 'Lainnya' },
]

export const PRIORITIES: Array<{ value: DeadlinePriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function getTypeLabel(type: DeadlineType) {
  return DEADLINE_TYPES.find((item) => item.value === type)?.label ?? 'Deadline'
}

export function getSourceLabel(source: DeadlineSource) {
  return DEADLINE_SOURCES.find((item) => item.value === source)?.label ?? 'Lainnya'
}
