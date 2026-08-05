import { useTranslation } from 'react-i18next'
import { Guestbook } from '@/components/Guestbook'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePageEntered } from '@/hooks/usePageEntered'

export function GuestbookPage() {
  const { t } = useTranslation()
  const entered = usePageEntered()
  useDocumentTitle('seo.guestbookTitle')

  return (
    <main
      className={`page page--guestbook${entered ? ' page--entered' : ''}`}
      aria-label={t('guestbook.title')}
    >
      <section className="guestbook-view" aria-labelledby="guestbook-title">
        <div className="guestbook-card">
          <div className="guestbook-heading">
            <h1 id="guestbook-title">{t('guestbook.title')}</h1>
            <p>{t('guestbook.subtitle')}</p>
          </div>
          <Guestbook />
        </div>
      </section>
    </main>
  )
}
