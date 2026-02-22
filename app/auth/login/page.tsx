'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const callbackError = searchParams.get('error')

  const [loading, setLoading] = useState<'google' | 'kakao' | null>(null)
  const [error] = useState<string | null>(
    callbackError ? '로그인 중 오류가 발생했습니다. 다시 시도해주세요.' : null,
  )

  async function handleOAuth(provider: 'google' | 'kakao') {
    setLoading(provider)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    })
    if (err) {
      setLoading(null)
    }
    // On success, browser redirects — loading stays true
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-12 group">
        <span className="font-black text-gray-900 text-lg tracking-tight">
          Miso Studio
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 mb-2">시작하기</h1>
          <p className="text-sm text-gray-400">소셜 계정으로 간편하게 로그인하세요</p>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-500 text-center mb-6 px-4 py-3 bg-red-50 rounded-2xl">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {/* Google */}
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!loading}
            className="relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 bg-white text-sm font-semibold text-gray-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === 'google' ? (
              <svg className="w-5 h-5 animate-spin text-gray-400 shrink-0" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="8" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="flex-1 text-center">
              {loading === 'google' ? '구글 로그인 중…' : 'Google로 계속하기'}
            </span>
          </button>

          {/* Kakao */}
          <button
            onClick={() => handleOAuth('kakao')}
            disabled={!!loading}
            className="relative w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 border-transparent bg-[#FEE500] hover:bg-[#F5DC00] text-sm font-semibold text-[#191600] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FEE500] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === 'kakao' ? (
              <svg className="w-5 h-5 animate-spin text-[#191600]/60 shrink-0" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="8" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#191600">
                <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.67 1.72 5.01 4.33 6.35l-.88 3.26c-.08.29.24.52.49.35L11.1 18c.3.02.6.03.9.03 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
              </svg>
            )}
            <span className="flex-1 text-center">
              {loading === 'kakao' ? '카카오 로그인 중…' : '카카오로 계속하기'}
            </span>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          <Link href="/" className="hover:text-gray-700 transition-colors underline">
            홈으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
