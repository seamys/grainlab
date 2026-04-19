import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import en from './en'

type MessageSchema = typeof zhCN

function getLocale(): string {
  const saved = localStorage.getItem('lang')
  if (saved && (saved === 'zh-CN' || saved === 'en')) return saved
  return navigator.language.startsWith('zh') ? 'zh-CN' : 'en'
}

const i18n = createI18n<[MessageSchema], 'zh-CN' | 'en'>({
  legacy: false,
  locale: getLocale(),
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})

export default i18n

export function toggleLocale() {
  const loc = i18n.global.locale as unknown as { value: string }
  const current = loc.value
  const next = current === 'zh-CN' ? 'en' : 'zh-CN'
  loc.value = next
  localStorage.setItem('lang', next)
  document.title = i18n.global.t('app.title')
}
