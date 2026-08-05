import type { MouseEvent, ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

/** 与 site.css 中 html.page-leaving 退场动画时长保持一致 */
const EXIT_DELAY_MS = 520

interface TransitionNavLinkProps {
  to: string
  children: ReactNode
  className?: string
}

/**
 * 站内导航链接：点击时播放退场遮罩动画，延时后完成路由切换；
 * 其余情况（新标签打开、修饰键、当前页、减少动效偏好）走默认行为。
 */
export function TransitionNavLink({ to, children, className }: TransitionNavLinkProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const prefersReducedMotion = usePrefersReducedMotion()

  const isCurrent = location.pathname === to

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      isCurrent ||
      prefersReducedMotion ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      document.documentElement.classList.contains('page-leaving')
    ) {
      return
    }
    event.preventDefault()
    document.documentElement.classList.add('page-leaving')
    window.setTimeout(() => navigate(to), EXIT_DELAY_MS)
  }

  return (
    <NavLink to={to} className={className} onClick={handleClick}>
      {children}
    </NavLink>
  )
}
