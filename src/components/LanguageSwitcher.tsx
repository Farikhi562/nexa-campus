'use client'

import { useLang, type Lang } from '@/lib/i18n'

const LANGS: { key: Lang; flag: string; label: string }[] = [
  { key: 'id', flag: '🇮🇩', label: 'ID' },
  { key: 'en', flag: '🇬🇧', label: 'EN' },
  { key: 'zh', flag: '🇨🇳', label: 'ZH' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang()

  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {LANGS.map(({ key, flag, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setLang(key)}
          title={label}
          aria-label={`Switch to ${label}`}
          className={`flex items-center gap-1 px-2 py-1.5 text-[11px] font-black transition ${
            lang === key
              ? 'bg-slate-950 text-white'
              : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>{flag}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
