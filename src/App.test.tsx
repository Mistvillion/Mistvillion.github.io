import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { changeLanguage } from '@/i18n'

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('在 / 渲染首页与导航', () => {
    changeLanguage('zh')
    renderApp('/')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('北城烟雨阁')
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '留言板' })).toBeInTheDocument()
  })

  it('未知路径重定向回首页', () => {
    renderApp('/does-not-exist')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('北城烟雨阁')
  })
})
