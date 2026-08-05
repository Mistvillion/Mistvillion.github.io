import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { TransitionNavLink } from '@/components/TransitionNavLink'
import { externalLinks } from '@/data/site'

const INTERNAL_LINKS = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/profile', labelKey: 'nav.profile' },
  { to: '/guestbook', labelKey: 'nav.guestbook' },
] as const

export function TopNav() {
  const { t } = useTranslation()

  return (
    <nav className="top-nav" aria-label={t('nav.aria')}>
      {INTERNAL_LINKS.map((link) => (
        <TransitionNavLink key={link.to} to={link.to} className="nav-link">
          {t(link.labelKey)}
        </TransitionNavLink>
      ))}
      {externalLinks.map((link) => (
        <a
          key={link.href}
          className="nav-link"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t(link.labelKey)}
        </a>
      ))}
      <LanguageSwitcher />
    </nav>
  )
}
