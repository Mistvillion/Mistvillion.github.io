import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransitionNavLink } from '@/components/TransitionNavLink'

function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <TransitionNavLink to="/profile">Profile</TransitionNavLink>
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/profile" element={<p>profile</p>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('TransitionNavLink', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('点击跳转到目标路由', async () => {
    // 模拟"减少动效"偏好，跳过 520ms 退场延时，点击立即导航
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )

    renderWithRoutes()
    const link = screen.getByRole('link', { name: 'Profile' })
    await userEvent.click(link)

    expect(screen.getByTestId('location')).toHaveTextContent('/profile')
    expect(screen.getByText('profile')).toBeInTheDocument()
  })

  it('当前页链接点击不触发导航', async () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <TransitionNavLink to="/profile">Profile</TransitionNavLink>
        <LocationProbe />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Profile' })
    await userEvent.click(link)
    expect(screen.getByTestId('location')).toHaveTextContent('/profile')
  })
})
