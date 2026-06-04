'use client'

import AskNexaPanel from '@/components/ai/AskNexaPanel'
import type { AcademicDeadline } from '@/types'

export default function AskNexaWidget({ deadlines = [] }: { deadlines?: AcademicDeadline[] }) {
  return <AskNexaPanel deadlines={deadlines} />
}
