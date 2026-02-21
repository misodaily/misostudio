import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { StoreProvider } from '@/lib/store'
import { ToastProvider } from '@/components/toast-provider'
import { Header } from '@/components/header'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Miso Studio — AI 영상 생성',
  description:
    '사진 한 장으로 시네마틱 영상을 생성하는 AI 서비스. 클릭 한 번으로 당신의 사진이 압도적인 시네마틱 영상으로 다시 태어납니다.',
  keywords: ['AI 영상 생성', '이미지 투 비디오', 'Runway', 'Miso Studio'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-gray-900 min-h-screen">
        <StoreProvider>
          <ToastProvider>
            <Header />
            <main>{children}</main>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
