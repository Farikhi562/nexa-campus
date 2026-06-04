'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

export default function SubscriptionIntentActions({
  intentId,
  disabled,
}: {
  intentId: string
  disabled?: boolean
}) {
  const [loadingAction, setLoadingAction] = useState<'confirm' | 'reject' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(action: 'confirm' | 'reject') {
    setLoadingAction(action)
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/subscription-intents/${intentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const result = (await response.json().catch(() => null)) as { error?: string } | null

    setLoadingAction(null)

    if (!response.ok) {
      setError(result?.error || 'Action gagal diproses.')
      return
    }

    setMessage(action === 'confirm' ? 'Upgrade dikonfirmasi.' : 'Intent ditolak.')
    window.setTimeout(() => window.location.reload(), 900)
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          disabled={disabled || Boolean(loadingAction)}
          onClick={() => submit('confirm')}
          className="min-h-10 rounded-2xl"
        >
          {loadingAction === 'confirm' ? 'Confirming...' : 'Confirm'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || Boolean(loadingAction)}
          onClick={() => submit('reject')}
          className="min-h-10 rounded-2xl"
        >
          {loadingAction === 'reject' ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
      {message && <p className="rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</p>}
      {error && <p className="rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
    </div>
  )
}
