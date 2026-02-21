'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useHistory, useStore, useCreditBalance } from '@/lib/store'
import { getTemplateById } from '@/lib/templates'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/toast-provider'
import type { CreateJobStatus } from '@/lib/store'

// ── Status badge ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  CreateJobStatus,
  { label: string; color: string }
> = {
  queued: { label: '대기 중', color: 'bg-gray-100 text-gray-500' },
  processing: { label: '생성 중', color: 'bg-blue-50 text-blue-500' },
  done: { label: '완료', color: 'bg-emerald-50 text-emerald-600' },
  failed: { label: '실패', color: 'bg-red-50 text-red-500' },
  canceled: { label: '취소됨', color: 'bg-gray-100 text-gray-400' },
}

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
        <p className="text-sm text-gray-500 mb-5">
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

// ── Empty State ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-24 text-center">
      <div
        className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto mb-5"
        aria-hidden="true"
      >
        <svg className="w-8 h-8 text-[#F97316]" viewBox="0 0 32 32" fill="none">
          <path
            d="M6 26V12L16 4l10 8v14H6zM12 26v-8h8v8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">생성 기록이 없습니다</h2>
      <p className="text-sm text-gray-400 mb-6">
        템플릿을 선택하고 첫 번째 영상을 만들어보세요.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-3 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
      >
        템플릿 탐색하기
      </Link>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MyPage() {
  const history = useHistory()
  const creditBalance = useCreditBalance()
  const [chargeOpen, setChargeOpen] = useState(false)

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">내 기록</h1>
            <p className="text-sm text-gray-400">생성한 영상 기록을 확인합니다.</p>
          </div>

          {/* Credit card */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 border border-orange-100">
              <svg className="w-4 h-4 text-[#F97316]" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="7" />
              </svg>
              <span className="text-sm font-black text-gray-900">{creditBalance}</span>
              <span className="text-xs text-gray-500">크레딧</span>
            </div>
            <button
              onClick={() => setChargeOpen(true)}
              className="text-xs font-semibold text-[#F97316] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded"
            >
              충전하기 →
            </button>
          </div>
        </div>

        {/* History list */}
        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3" role="list" aria-label="생성 기록">
            {history.map((job) => {
              const template = getTemplateById(job.templateId)
              const status = STATUS_MAP[job.status]
              const isClickable = job.status === 'done'

              const inner = (
                <div
                  className={[
                    'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
                    isClickable
                      ? 'border-gray-100 hover:border-[#F97316]/30 hover:bg-orange-50/20 cursor-pointer'
                      : 'border-gray-100 cursor-default',
                  ].join(' ')}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={job.sourceImageDataUrl}
                      alt={`${template?.titleKo ?? '알 수 없음'} 원본 이미지`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {template?.titleKo ?? '알 수 없는 템플릿'}
                      </p>
                      <span
                        className={[
                          'shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full',
                          status.color,
                        ].join(' ')}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatDate(job.createdAt)} · {job.options.durationSec}초 · {job.options.intensity}
                    </p>
                  </div>

                  {/* Arrow for clickable items */}
                  {isClickable && (
                    <svg
                      className="w-4 h-4 text-gray-300 shrink-0"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 12l4-4-4-4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              )

              return (
                <div key={job.jobId} role="listitem">
                  {isClickable ? (
                    <Link
                      href={`/result/${job.jobId}`}
                      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-2xl"
                      aria-label={`${template?.titleKo} 결과 보기`}
                    >
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {chargeOpen && <ChargeModal onClose={() => setChargeOpen(false)} />}
    </>
  )
}
