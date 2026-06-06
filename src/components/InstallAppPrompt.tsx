'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  )
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (!isMobileDevice() || isStandalone()) return
    if (window.localStorage.getItem('nexa_install_prompt_dismissed') === 'true') return

    setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent))
    const timer = window.setTimeout(() => setVisible(true), 1600)

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function installApp() {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice.catch(() => null)
    setInstallEvent(null)
    setVisible(false)
  }

  function dismiss() {
    window.localStorage.setItem('nexa_install_prompt_dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 sm:hidden">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Tutup install prompt"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-8">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Download className="h-5 w-5" />
        </div>
        <div>
          <p className="font-black text-slate-950">Install NEXA Campus</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Biar deadline lebih gampang dicek dari homescreen HP.
            {isIos && !installEvent ? ' Di Safari, tap Share lalu Add to Home Screen.' : ''}
          </p>
        </div>
      </div>
      {installEvent && (
        <button
          type="button"
          onClick={installApp}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700"
        >
          Install Aplikasi
        </button>
      )}
    </div>
  )
}
