'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCreditBalance, useStore } from '@/lib/store'
import { useToast } from './toast-provider'

// ── Charge Dialog ──────────────────────────────────────────────────────────

const CHARGE_PACKS = [
  { credits: 10, label: '10 크레딧', price: '₩5,900' },
  { credits: 30, label: '30 크레딧', price: '₩14,900' },
  { credits: 50, label: '50 크레딧', price: '₩22,900', badge: '인기' },
]

function ChargeModal({ onClose }: { onClose: () => void }) {
  const { addCredits } = useStore()
  const toast = useToast()

  function handleCharge(credits: number, label: string) {
    addCredits(credits)
    toast(`${label} 충전 완료! 🎉`, 'success')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="크레딧 충전"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">크레딧 충전</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          충전 후 AI 영상 생성에 바로 사용할 수 있습니다.
          <br />
          <span className="text-[#F97316] font-medium">미리보기 모드</span>에서는 실제 결제 없이 크레딧이 추가됩니다.
        </p>

        <div className="flex flex-col gap-3">
          {CHARGE_PACKS.map((pack) => (
            <button
              key={pack.credits}
              onClick={() => handleCharge(pack.credits, pack.label)}
              className="relative flex items-center justify-between w-full px-5 py-4 rounded-2xl border-2 border-gray-100 hover:border-[#F97316] hover:bg-orange-50/30 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
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
  const [chargeOpen, setChargeOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-lg"
          >
            <span className="text-lg" aria-hidden="true">✦</span>
            <span className="font-black text-gray-900 tracking-tight text-base">
              Miso Studio
            </span>
          </Link>

          {/* Right nav */}
          <nav className="flex items-center gap-2" aria-label="상단 메뉴">
            {/* Credit balance */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-500">
              <svg className="w-3.5 h-3.5 text-[#F97316]" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" />
              </svg>
              <span>크레딧 잔액 {creditBalance}</span>
            </div>

            {/* Charge button */}
            <button
              onClick={() => setChargeOpen(true)}
              className="px-3 py-1.5 rounded-full border border-orange-200 text-xs font-semibold text-[#F97316] hover:bg-orange-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              충전하기
            </button>

            {/* Login button */}
            <button className="px-3 py-1.5 rounded-full bg-[#F97316] text-white text-xs font-bold hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2">
              로그인
            </button>

            {/* My page link */}
            <Link
              href="/my"
              aria-label="내 기록"
              className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M3 13.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </nav>
        </div>
      </header>

      {chargeOpen && <ChargeModal onClose={() => setChargeOpen(false)} />}
    </>
  )
}
