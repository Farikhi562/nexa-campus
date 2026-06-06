'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const SESSION_COUNT_KEY = 'nexa_pwa_session_count'
const DISMISS_COUNT_KEY = 'nexa_pwa_dismiss_count'
const INSTALLED_KEY = 'nexa_pwa_installed'
const REQUIRED_SESSIONS = 3
const MAX_DISMISSALS = 2

export default function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const dismissed = Number(window.localStorage.getItem(DISMISS_COUNT_KEY) || '0')
    const installed = window.localStorage.getItem(INSTALLED_KEY) === 'true'
    if (dismissed >= MAX_DISMISSALS || installed || window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    const sessions = Number(window.localStorage.getItem(SESSION_COUNT_KEY) || '0') + 1
    window.localStorage.setItem(SESSION_COUNT_KEY, String(sessions))

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      const promptEvent = event as BeforeInstallPromptEvent
      setInstallPrompt(promptEvent)
      if (sessions >= REQUIRED_SESSIONS) {
        setVisible(true)
      }
    }

    const handleInstalled = () => {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
      setVisible(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
    }
    setVisible(false)
    setInstallPrompt(null)
  }

  const dismiss = () => {
    const dismissed = Number(window.localStorage.getItem(DISMISS_COUNT_KEY) || '0') + 1
    window.localStorage.setItem(DISMISS_COUNT_KEY, String(dismissed))
    setVisible(false)
  }

  if (!visible || !installPrompt) {
    return null
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-brand-200 bg-white p-4 shadow-2xl sm:bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">Install NEXA Campus — buka langsung tanpa browser</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-black text-white hover:bg-brand-700"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Nanti aja
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Tutup banner install"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
