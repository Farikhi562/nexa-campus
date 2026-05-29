export type BadgeId = 'first_exam' | 'on_fire' | 'diligent' | 'perfect_score'

export const BADGES: Array<{
  id: BadgeId
  icon: string
  title: string
  description: string
}> = [
  {
    id: 'first_exam',
    icon: '🥇',
    title: 'Pertama!',
    description: 'Selesaikan exam pertama.',
  },
  {
    id: 'on_fire',
    icon: '🔥',
    title: 'On Fire',
    description: 'Pertahankan streak 7 hari.',
  },
  {
    id: 'diligent',
    icon: '📚',
    title: 'Rajin',
    description: 'Upload 5 Dokumen.',
  },
  {
    id: 'perfect_score',
    icon: '💯',
    title: 'Sempurna',
    description: 'Dapatkan score 100 di satu exam.',
  },
]
