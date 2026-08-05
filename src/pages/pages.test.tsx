import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { changeLanguage } from '@/i18n'
import { GuestbookPage } from '@/pages/GuestbookPage'
import { HomePage } from '@/pages/HomePage'
import { ProfilePage } from '@/pages/ProfilePage'

describe('HomePage', () => {
  it('中文渲染站点名与 kicker', () => {
    changeLanguage('zh')
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('北城烟雨阁')
    expect(screen.getByText('雾都之家')).toBeInTheDocument()
  })

  it('英文渲染英文 kicker', () => {
    changeLanguage('en')
    render(<HomePage />)
    expect(screen.getByText("Mistvillion's Home")).toBeInTheDocument()
  })
})

describe('ProfilePage', () => {
  it('渲染占位简介', () => {
    changeLanguage('zh')
    render(<ProfilePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('个人简介')
    expect(screen.getByText(/占位简介/)).toBeInTheDocument()
  })
})

describe('GuestbookPage', () => {
  it('渲染留言板卡片', () => {
    changeLanguage('zh')
    render(<GuestbookPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('留言板')
    expect(document.querySelector('.giscus')).toBeInTheDocument()
  })
})
