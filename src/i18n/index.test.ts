import { beforeEach, describe, expect, it } from 'vitest'
import i18n, { changeLanguage, getInitialLang } from '@/i18n'

function stubNavigatorLanguage(lang: string) {
  Object.defineProperty(window.navigator, 'language', {
    value: lang,
    configurable: true,
  })
}

describe('i18n', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('浏览器语言为中文时默认中文', () => {
    stubNavigatorLanguage('zh-CN')
    expect(getInitialLang()).toBe('zh')
  })

  it('其他语言默认英文', () => {
    stubNavigatorLanguage('en-US')
    expect(getInitialLang()).toBe('en')
  })

  it('localStorage 记忆优先于浏览器语言', () => {
    window.localStorage.setItem('lang', 'en')
    stubNavigatorLanguage('zh-CN')
    expect(getInitialLang()).toBe('en')
  })

  it('changeLanguage 持久化并同步 html lang', () => {
    changeLanguage('en')
    expect(window.localStorage.getItem('lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(i18n.language.startsWith('en')).toBe(true)

    changeLanguage('zh')
    expect(window.localStorage.getItem('lang')).toBe('zh')
    expect(document.documentElement.lang).toBe('zh-CN')
  })
})
