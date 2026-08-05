import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { guestbook, isGuestbookConfigured } from '@/config/guestbook'

const GISCUS_ORIGIN = 'https://giscus.app'

function giscusLang(language: string): string {
  return language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

/**
 * Giscus 封装：挂载时注入 giscus 脚本；语言切换时向已有 iframe
 * 发送 setConfig 消息（theme / lang），避免整页重载。
 */
export function Guestbook() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { i18n, t } = useTranslation()
  const lang = giscusLang(i18n.language)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !isGuestbookConfigured) {
      return
    }

    const iframe = container.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: guestbook.theme } } },
        GISCUS_ORIGIN,
      )
      iframe.contentWindow.postMessage({ giscus: { setConfig: { lang } } }, GISCUS_ORIGIN)
      return
    }

    // StrictMode 下避免重复注入
    if (container.querySelector('script[data-repo]')) {
      return
    }

    const script = document.createElement('script')
    script.src = `${GISCUS_ORIGIN}/client.js`
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', guestbook.repo)
    script.setAttribute('data-repo-id', guestbook.repoId)
    script.setAttribute('data-category', guestbook.category)
    script.setAttribute('data-category-id', guestbook.categoryId)
    script.setAttribute('data-mapping', guestbook.mapping)
    script.setAttribute('data-strict', guestbook.strict)
    script.setAttribute('data-reactions-enabled', guestbook.reactionsEnabled)
    script.setAttribute('data-emit-metadata', guestbook.emitMetadata)
    script.setAttribute('data-input-position', guestbook.inputPosition)
    script.setAttribute('data-theme', guestbook.theme)
    script.setAttribute('data-lang', lang)
    container.appendChild(script)
  }, [lang])

  if (!isGuestbookConfigured) {
    return <p className="guestbook-empty">{t('guestbook.notConfigured')}</p>
  }

  return <div ref={containerRef} className="giscus" />
}
