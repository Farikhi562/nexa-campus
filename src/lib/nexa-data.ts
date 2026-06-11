import type { DeadlinePriority, DeadlineSource, DeadlineStatus, DeadlineType, Plan } from '@/types'

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
    positioning: 'Untuk mulai mencatat deadline dengan rapi.',
    features: [
      'Maksimal 5 deadline aktif',
      'Dashboard dasar',
      'Countdown deadline',
      'Input deadline manual',
      'AI Quick Add preview',
    ],
    highlighted: false,
  },
  {
    id: 'pulse',
    name: PLAN_LABELS.pulse,
    price: 'Rp15.000',
    suffix: '/bulan',
    positioning: 'Untuk yang butuh reminder otomatis.',
    features: [
      'Deadline aktif tanpa batas',
      'Reminder H-1 dan hari-H',
      'Ringkasan mingguan',
      'Kategori deadline lengkap',
      'Prioritas dasar',
      'AI Quick Add preview',
    ],
    highlighted: false,
  },
  {
    id: 'command',
    name: PLAN_LABELS.command,
    price: 'Rp25.000',
    suffix: '/bulan',
    positioning: 'Untuk yang ingin kontrol reminder lebih detail.',
    features: [
      'Semua fitur Pulse',
      'Custom reminder H-7, H-3, H-1, dan hari-H',
      'Jam reminder bisa diatur',
      'AI Quick Add preview',
      'Ask NEXA preview',
      'Akses fitur baru lebih awal',
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

export const DEADLINE_STATUSES: Array<{ value: DeadlineStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

export function getTypeLabel(type: DeadlineType) {
  return DEADLINE_TYPES.find((item) => item.value === type)?.label ?? 'Deadline'
}

export function getSourceLabel(source: DeadlineSource) {
  return DEADLINE_SOURCES.find((item) => item.value === source)?.label ?? 'Lainnya'
}
