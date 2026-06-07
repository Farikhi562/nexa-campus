'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { setLang as persistLang, t as translate, type Lang, type TranslationKey } from '@/lib/i18n'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const STORAGE_KEY = 'nexa_lang'
const LANG_CHANGE_EVENT = 'nexa_lang_change'
const FALLBACK_LANG: Lang = 'id'
const SUPPORTED_LANGS: Lang[] = ['id', 'en', 'zh']

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return FALLBACK_LANG

  const storedLang = window.localStorage.getItem(STORAGE_KEY)

  if (SUPPORTED_LANGS.includes(storedLang as Lang)) {
    return storedLang as Lang
  }

  return FALLBACK_LANG
}

const LanguageContext = createContext<LanguageContextType>({
  lang: FALLBACK_LANG,
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(FALLBACK_LANG)

  useEffect(() => {
    setLangState(readStoredLang())

    const handler = () => setLangState(readStoredLang())

    window.addEventListener(LANG_CHANGE_EVENT, handler)
    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    persistLang(newLang)
    setLangState(newLang)
  }, [])

  const tFn = useCallback((key: TranslationKey) => translate(key, lang), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT() {
  return useContext(LanguageContext)
}
