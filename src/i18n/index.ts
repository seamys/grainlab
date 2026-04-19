import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import zhTW from './zh-TW'
import en from './en'
import ja from './ja'
import ko from './ko'
import fr from './fr'
import de from './de'
import es from './es'
import pt from './pt'

type MessageSchema = typeof en

export type LocaleCode = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'pt'

export const LOCALES: { code: LocaleCode; label: string }[] = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en',    label: 'English' },
  { code: 'ja',    label: '日本語' },
  { code: 'ko',    label: '한국어' },
  { code: 'fr',    label: 'Français' },
  { code: 'de',    label: 'Deutsch' },
  { code: 'es',    label: 'Español' },
  { code: 'pt',    label: 'Português' },
]

const VALID_CODES = LOCALES.map(l => l.code)

function getLocale(): LocaleCode {
  const saved = localStorage.getItem('lang') as LocaleCode | null
  if (saved && VALID_CODES.includes(saved)) return saved
  const nav = navigator.language
  if (nav.startsWith('zh-TW') || nav.startsWith('zh-HK') || nav.startsWith('zh-MO')) return 'zh-TW'
  if (nav.startsWith('zh')) return 'zh-CN'
  if (nav.startsWith('ja')) return 'ja'
  if (nav.startsWith('ko')) return 'ko'
  if (nav.startsWith('fr')) return 'fr'
  if (nav.startsWith('de')) return 'de'
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('pt')) return 'pt'
  return 'en'
}

const i18n = createI18n<[MessageSchema], LocaleCode>({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    en,
    ja,
    ko,
    fr,
    de,
    es,
    pt,
  },
})

export default i18n

export function setLocale(code: LocaleCode) {
  const loc = i18n.global.locale as unknown as { value: string }
  loc.value = code
  localStorage.setItem('lang', code)
  document.title = i18n.global.t('app.title')
}

/** @deprecated use setLocale */
export function toggleLocale() {
  const loc = i18n.global.locale as unknown as { value: LocaleCode }
  const idx = VALID_CODES.indexOf(loc.value)
  const next = VALID_CODES[(idx + 1) % VALID_CODES.length]
  setLocale(next)
}
