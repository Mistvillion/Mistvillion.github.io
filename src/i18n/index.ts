import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zh from './locales/zh.json'

export const SUPPORTED_LANGS = ['zh', 'en'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]

const STORAGE_KEY = 'lang'

function isSupportedLang(value: string | null): value is Lang {
  return value === 'zh' || value === 'en'
}

function detectBrowserLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : ''
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

/** 初始语言：localStorage 记忆优先，其次跟随浏览器语言，回退中文 */
export function getInitialLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isSupportedLang(stored)) {
      return stored
    }
  } catch {
    // localStorage 不可用时静默降级
  }
  return detectBrowserLang()
}

function applyHtmlLang(lang: Lang) {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
}

/** 切换语言：即时生效、localStorage 持久化、同步 <html lang> */
export function changeLanguage(lang: Lang) {
  void i18n.changeLanguage(lang)
  try {
    window.localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // 忽略存储异常
  }
  applyHtmlLang(lang)
}

const initialLang = getInitialLang()

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

applyHtmlLang(initialLang)

export default i18n
