'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useJob, useStore } from '@/lib/store'
import { ProgressStage } from '@/components/progress-stage'

// Progress checkpoints: [progress, delayMs from previous checkpoint]
const PROGRESS_STEPS: [number, number][] = [
  [10, 800],
  [25, 1000],
  [45, 1500],
  [70, 1800],
  [85, 1200],
  [100, 1000],
]

// Decide outcome at mount (10% fail)
function shouldFail(): boolean {
  return Math.random() < 0.1
}

// ── Cancel Dialog ──────────────────────────────────────────────────────────

function CancelDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="생성 취소 확인"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-2">생성을 취소할까요?</h2>
        <p className="text-sm text-gray-500 mb-6">
          취소하면 소모된 크레딧이 반환됩니다. 진행 중인 작업이 중단됩니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            계속 진행
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            취소하기
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CreatePage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()
  const job = useJob(jobId)
  const { updateJob, addCredits, createJob, spendCredits } = useStore()

  const [showCancel, setShowCancel] = useState(false)
  const didStartRef = useRef(false)
  const willFailRef = useRef(shouldFail())
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clear all pending timeouts
  function clearAllTimeouts() {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  // Start simulation on mount
  useEffect(() => {
    if (!job) return
    if (didStartRef.current) return
    if (job.status !== 'queued') return

    didStartRef.current = true
    updateJob(jobId, { status: 'processing', progress: 0 })

    let cumulativeDelay = 0
    let willAbort = false

    for (let i = 0; i < PROGRESS_STEPS.length; i++) {
      const [progress, delay] = PROGRESS_STEPS[i]
      cumulativeDelay += delay

      const t = setTimeout(() => {
        if (willAbort) return

        // Check if canceled externally
        if (job.status === 'canceled') return

        // Decide if we should fail at 70%
        if (progress >= 70 && willFailRef.current) {
          willAbort = true
          clearAllTimeouts()
          updateJob(jobId, {
            status: 'failed',
            progress: 70,
            errorMessage: '영상 생성 중 오류가 발생했습니다. Runway API 응답 없음 (시뮬레이션).',
          })
          return
        }

        if (progress === 100) {
          updateJob(jobId, {
            status: 'done',
            progress: 100,
            result: {
              previewVideoUrl: '/sample.mp4',
              shareUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/result/${jobId}`,
            },
          })
          // Navigate to result
          setTimeout(() => router.push(`/result/${jobId}`), 600)
        } else {
          updateJob(jobId, { progress })
        }
      }, cumulativeDelay)

      timeoutsRef.current.push(t)
    }

    return () => {
      clearAllTimeouts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  // Handle cancel confirmation
  function handleCancelConfirm() {
    clearAllTimeouts()
    if (job) {
      // Refund credits
      const refundAmount = (job.options.durationSec === 5 ? 2 : 1)
      addCredits(refundAmount)
      updateJob(jobId, { status: 'canceled', progress: job.progress })
    }
    router.push(`/t/${job?.templateId ?? ''}`)
  }

  // Handle retry
  function handleRetry() {
    if (!job) return
    spendCredits(job.options.durationSec === 5 ? 2 : 1)
    const newJobId = createJob(job.templateId, job.sourceImageDataUrl, job.options)
    router.push(`/create/${newJobId}`)
  }

  if (!job) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-5xl" aria-hidden="true">✦</p>
        <h1 className="text-xl font-bold text-gray-900">작업을 찾을 수 없습니다</h1>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  // ── Failed State ──────────────────────────────────────────────────────────

  if (job.status === 'failed') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div
          className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6"
          aria-hidden="true"
        >
          <svg className="w-8 h-8 text-red-500" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
            <path
              d="M11 11l10 10M21 11L11 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">생성 실패</h1>
        <p className="text-sm text-gray-500 mb-2">{job.errorMessage}</p>
        <p className="text-xs text-gray-400 mb-8">크레딧은 반환되지 않았습니다. (재시도 시 소모)</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            className="w-full py-4 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
          >
            재시도 (크레딧 소모)
          </button>
          <Link
            href={`/t/${job.templateId}`}
            className="w-full py-4 border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:border-gray-300 transition-colors text-center"
          >
            템플릿으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // ── Processing State ───────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-3xl mx-auto mb-6 animate-pulse"
            style={{
              background: 'linear-gradient(135deg, #F97316, #FFB703)',
            }}
            aria-hidden="true"
          />
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            AI 라이브 포토 생성 중
          </h1>
          <p className="text-sm text-gray-400">
            잠시만 기다려주세요. 완료되면 자동으로 이동합니다.
          </p>
        </div>

        <ProgressStage progress={job.progress} />

        {/* Cancel */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setShowCancel(true)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
            aria-label="생성 취소하기"
          >
            취소하기
          </button>
        </div>
      </div>

      {showCancel && (
        <CancelDialog
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancel(false)}
        />
      )}
    </>
  )
}
