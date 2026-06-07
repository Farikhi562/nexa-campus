'use client'

import { LANG_LABELS, setLang, type Lang } from '@/lib/i18n'
import { useT } from '@/components/LanguageProvider'

export default function LanguageSwitcher() {
  const { lang, setLang: setAppLang } = useT()

  function change(l: Lang) {
    setAppLang(l)
    setLang(l)
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
        <button
          key={code}
          onClick={() => change(code)}
          className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-sm font-black transition ${
            lang === code
              ? 'border-teal-400 bg-teal-50 text-teal-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className="text-2xl">{label.split(' ')[0]}</span>
          <span>{label.split(' ').slice(1).join(' ')}</span>
          {lang === code && <span className="ml-auto text-teal-500">✓</span>}
        </button>
      ))}
    </div>
  )
}
