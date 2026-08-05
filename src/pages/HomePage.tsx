import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePageEntered } from '@/hooks/usePageEntered'

export function HomePage() {
  const { t } = useTranslation()
  const entered = usePageEntered()
  useDocumentTitle('seo.title')

  return (
    <main
      className={`page page--home${entered ? ' page--entered' : ''}`}
      aria-label={t('site.name')}
    >
      <section className="home" aria-labelledby="site-title">
        <div className="title-block">
          <p className="site-kicker">{t('site.kicker')}</p>
          <h1 className="site-title" id="site-title">
            {t('site.name')}
          </h1>
        </div>
      </section>
    </main>
  )
}
