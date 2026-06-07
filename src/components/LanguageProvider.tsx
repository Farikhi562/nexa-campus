'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getLang, setLang as persistLang, t as translate, type Lang, type TranslationKey } from '@/lib/i18n'

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'id',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('id')

  useEffect(() => {
    setLangState(getLang())
    const handler = () => setLangState(getLang())
    window.addEventListener('nexa_lang_change', handler)
    return () => window.removeEventListener('nexa_lang_change', handler)
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
