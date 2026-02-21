import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Miso Studio — AI 영상 생성',
    description: '사진 한 장으로 시네마틱 5초 영상을 생성하는 AI 서비스. Runway Gen4 Turbo 기반.',
    keywords: ['AI 영상 생성', '이미지 투 비디오', 'Runway', 'Miso Studio'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" className={inter.variable}>
            <body className="font-sans antialiased bg-[#023047] text-white">
                {children}
            </body>
        </html>
    );
}
