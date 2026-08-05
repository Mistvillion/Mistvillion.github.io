import { useEffect, useState } from 'react'

/**
 * 页面进场：挂载后两帧再添加 page--entered，
 * 让 CSS 过渡从初始状态（透明/模糊/位移）平滑进入，兼容各路由间切换。
 */
export function usePageEntered(): boolean {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [])

  return entered
}
