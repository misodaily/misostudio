'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreditBalance, useStore } from '@/lib/store'
import { useToast } from './toast-provider'
import { createClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

// ── Charge Dialog ──────────────────────────────────────────────────────────

const CHARGE_PACKS = [
  { credits: 10, label: '10 크레딧', price: '₩5,900' },
  { credits: 30, label: '30 크레딧', price: '₩14,900' },
  { credits: 50, label: '50 크레딧', price: '₩22,900', badge: '인기' },
]

function ChargeModal({ onClose }: { onClose: () => void }) {
  const { setBalance } = useStore()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  async function handleCharge(credits: number, label: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: credits }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBalance(data.balance)
      toast(`${label} 충전 완료!`, 'success')
      onClose()
    } catch {
      toast('충전에 실패했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="크레딧 충전"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">크레딧 충전</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {CHARGE_PACKS.map((pack) => (
            <button
              key={pack.credits}
              onClick={() => handleCharge(pack.credits, pack.label)}
              disabled={loading}
              className="relative flex items-center justify-between w-full px-5 py-4 rounded-2xl border-2 border-gray-100 hover:border-[#F97316] hover:bg-orange-50/30 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-gray-900 group-hover:text-[#F97316] transition-colors">
                  {pack.credits}
                </span>
                <span className="text-sm text-gray-500">크레딧</span>
                {pack.badge && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#F97316] text-white">
                    {pack.badge}
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-[#F97316] transition-colors">
                {pack.price}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Header ─────────────────────────────────────────────────────────────────

export function Header() {
  const creditBalance = useCreditBalance()
  const { setBalance } = useStore()
  const [chargeOpen, setChargeOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetch('/api/credits/balance')
          .then((r) => r.json())
          .then((d) => d.balance !== undefined && setBalance(d.balance))
          .catch(() => {})
      }
    })

    return () => subscription.unsubscribe()
  }, [setBalance])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast('로그아웃했습니다.', 'info')
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-lg"
          >
            <span className="font-black text-gray-900 tracking-tight text-base">
              Miso Studio
            </span>
          </Link>

          {/* Right nav */}
          <nav className="flex items-center gap-2" aria-label="상단 메뉴">
            {user && creditBalance !== null && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-500">
                <svg className="w-3.5 h-3.5 text-[#F97316]" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="8" cy="8" r="7" />
                </svg>
                <span>크레딧 잔액 {creditBalance}</span>
              </div>
            )}

            {user ? (
              <>
                <button
                  onClick={() => setChargeOpen(true)}
                  className="px-3 py-1.5 rounded-full border border-orange-200 text-xs font-semibold text-[#F97316] hover:bg-orange-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                >
                  충전하기
                </button>

                <Link
                  href="/my"
                  className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                  aria-label="내 기록"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 13.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded-full bg-[#F97316] text-white text-xs font-bold hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </header>

      {chargeOpen && <ChargeModal onClose={() => setChargeOpen(false)} />}
    </>
  )
}
