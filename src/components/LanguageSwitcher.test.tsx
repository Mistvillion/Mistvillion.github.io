import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { changeLanguage } from '@/i18n'

describe('LanguageSwitcher', () => {
  it('点击后切换语言并持久化', async () => {
    changeLanguage('zh')
    render(<LanguageSwitcher />)

    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('EN')

    await userEvent.click(button)

    expect(window.localStorage.getItem('lang')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(button).toHaveTextContent('中')

    await userEvent.click(button)
    expect(window.localStorage.getItem('lang')).toBe('zh')
    expect(document.documentElement.lang).toBe('zh-CN')
  })
})
