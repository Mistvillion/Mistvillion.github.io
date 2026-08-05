import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { TopNav } from '@/components/TopNav'
import { changeLanguage } from '@/i18n'

function renderNav() {
  return render(
    <MemoryRouter>
      <TopNav />
    </MemoryRouter>,
  )
}

describe('TopNav', () => {
  it('中文下渲染三个站内链接', () => {
    changeLanguage('zh')
    renderNav()
    expect(screen.getByRole('link', { name: '首页' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '个人简介' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '留言板' })).toBeInTheDocument()
  })

  it('外部链接在新标签页打开', () => {
    renderNav()
    const github = screen.getByRole('link', { name: 'GitHub' })
    expect(github).toHaveAttribute('href', 'https://github.com/Mistvillion')
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('渲染语言切换按钮', () => {
    renderNav()
    expect(screen.getByRole('button', { name: /切换/ })).toBeInTheDocument()
  })
})
