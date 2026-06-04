'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function DashboardSuccessToast() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('onboarding') !== 'success') {
      return
    }

    setVisible(true)
    const cleanParams = new URLSearchParams(searchParams.toString())
    cleanParams.delete('onboarding')
    const cleanQuery = cleanParams.toString()
    router.replace(cleanQuery ? `${pathname}?${cleanQuery}` : pathname, { scroll: false })

    const timer = window.setTimeout(() => setVisible(false), 4200)
    return () => window.clearTimeout(timer)
  }, [pathname, router, searchParams])

  if (!visible) {
    return null
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 shadow-xl">
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      Dashboard siap! Deadline pertama sudah masuk 🎯
    </div>
  )
}
