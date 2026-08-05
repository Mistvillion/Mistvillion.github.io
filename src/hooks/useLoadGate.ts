import { useEffect } from 'react'

const SAMPLE_GLYPH = '北城烟雨阁'
const MAX_WAIT_MS = 4000

/**
 * 首屏加载门控：等待字体与背景视频就绪（或 4s 超时）后，
 * 为 <html> 添加 page-ready，驱动全局进场动画（视频、遮罩、导航）。
 */
export function useLoadGate(): void {
  useEffect(() => {
    const root = document.documentElement
    const video = document.querySelector<HTMLVideoElement>('.background-video')
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 测试环境（jsdom）无 FontFaceSet，直接放行
    const fontReady =
      typeof document.fonts !== 'undefined' && document.fonts
        ? document.fonts.load('500 1em "LXGW WenKai"', SAMPLE_GLYPH).catch(() => undefined)
        : Promise.resolve(undefined)

    const videoReady = new Promise<void>((resolve) => {
      if (import.meta.env.MODE === 'test' || !video || video.readyState >= 2 || prefersReduced) {
        resolve()
        return
      }
      video.addEventListener('loadeddata', () => resolve(), { once: true })
      video.addEventListener('error', () => resolve(), { once: true })
    })

    Promise.race([
      Promise.all([fontReady, videoReady]).then(() => undefined),
      new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS)),
    ]).then(() => {
      requestAnimationFrame(() => root.classList.add('page-ready'))
    })

    // 浏览器前进/后退回到本页时解除退场状态
    const onPageShow = () => root.classList.remove('page-leaving')
    window.addEventListener('pageshow', onPageShow)

    return () => {
      window.removeEventListener('pageshow', onPageShow)
      root.classList.remove('page-ready', 'page-leaving')
    }
  }, [])
}
