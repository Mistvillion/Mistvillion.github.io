import { useTranslation } from 'react-i18next'
import { profileSections } from '@/data/profile'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePageEntered } from '@/hooks/usePageEntered'

export function ProfilePage() {
  const { t } = useTranslation()
  const entered = usePageEntered()
  useDocumentTitle('seo.profileTitle')

  return (
    <main
      className={`page page--profile${entered ? ' page--entered' : ''}`}
      aria-label={t('profile.title')}
    >
      <section className="profile-view" aria-labelledby="profile-title">
        <div className="profile-content">
          {profileSections.map((section) => (
            <div key={section.titleKey} className="profile-heading">
              <h1 id="profile-title">{t(section.titleKey)}</h1>
              {section.paragraphs.map((paragraphKey) => (
                <p key={paragraphKey}>{t(paragraphKey)}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
