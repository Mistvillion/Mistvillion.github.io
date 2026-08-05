import { useTranslation } from 'react-i18next'
import { changeLanguage, type Lang } from '@/i18n'

/** 中英文切换按钮：即时生效并持久化到 localStorage */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const isZh = i18n.language.toLowerCase().startsWith('zh')
  const target: Lang = isZh ? 'en' : 'zh'

  return (
    <button
      type="button"
      className="nav-link lang-toggle"
      onClick={() => changeLanguage(target)}
      aria-label={t('lang.switchTo')}
    >
      {isZh ? 'EN' : '中'}
    </button>
  )
}
