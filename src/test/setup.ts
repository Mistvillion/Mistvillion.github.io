import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { changeLanguage } from '@/i18n'

// jsdom 未实现 scrollTo，替换为静默 noop 避免警告
window.scrollTo = (() => {}) as typeof window.scrollTo

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  // 每个用例后复位到中文，保证用例间独立
  changeLanguage('zh')
})
