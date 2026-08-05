import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/** 按当前语言同步 document.title */
export function useDocumentTitle(titleKey: string): void {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = t(titleKey)
  }, [titleKey, t, i18n.language])
}
