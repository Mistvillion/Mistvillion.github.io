import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BackgroundVideo } from '@/components/BackgroundVideo'
import { TopNav } from '@/components/TopNav'
import { useLoadGate } from '@/hooks/useLoadGate'
import { GuestbookPage } from '@/pages/GuestbookPage'
import { HomePage } from '@/pages/HomePage'
import { ProfilePage } from '@/pages/ProfilePage'

export default function App() {
  const location = useLocation()
  useLoadGate()

  useEffect(() => {
    // 新页面挂载后：解除退场状态并回到页首（模拟真实页面跳转的初始滚动位置）
    document.documentElement.classList.remove('page-leaving')
    window.scrollTo?.(0, 0)
  }, [location.pathname])

  return (
    <>
      <BackgroundVideo />
      <div className="video-shade" aria-hidden="true" />
      <TopNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/guestbook" element={<GuestbookPage />} />
        {/* 未匹配路径回首页；服务端深链接由 404.html 兜底进入 SPA */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
