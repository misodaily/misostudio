'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { ProgressStage } from '@/components/progress-stage'

type JobStatus = 'queued' | 'processing' | 'done' | 'failed' | 'canceled'

type JobData = {
  jobId: string
  templateId: string
  status: JobStatus
  progress: number
  errorMessage?: string | null
  previewVideoUrl?: string | null
  options?: { durationSec?: number }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="생성 취소 확인">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-2">생성을 취소할까요?</h2>
        <p className="text-sm text-gray-500 mb-6">
          취소하면 소모된 크레딧이 <strong>전액 환불</strong>됩니다.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
            계속 진행
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
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
  const { setBalance } = useStore()

  const [job, setJob] = useState<JobData | null>(null)
  const [showCancel, setShowCancel] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Poll API every 1 second
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (res.status === 404) { setNotFound(true); stopPolling(); return }
        if (res.status === 401) { router.push('/auth/login'); return }
        if (!res.ok) return

        const data = await res.json()
        const fetched: JobData = data.job
        setJob(fetched)

        if (fetched.status === 'done') {
          stopPolling()
          setTimeout(() => router.push(`/result/${jobId}`), 500)
        }
        if (fetched.status === 'failed' || fetched.status === 'canceled') {
          stopPolling()
        }
      } catch {
        // Network error — keep polling
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 5000)
    return () => stopPolling()
  }, [jobId, router])

  async function handleCancelConfirm() {
    stopPolling()
    try {
      const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.creditBalance !== undefined) setBalance(data.creditBalance)
      }
    } catch { /* ignore */ }
    router.push(`/t/${job?.templateId ?? ''}`)
  }

  async function handleRetry() {
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { jobId: newJobId, creditBalance: newBalance } = await res.json()
      if (newBalance !== undefined) setBalance(newBalance)
      router.push(`/create/${newJobId}`)
    } catch {
      router.push(`/t/${job?.templateId ?? ''}`)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-bold text-gray-900">작업을 찾을 수 없습니다</h1>
        <Link href="/" className="px-5 py-2.5 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors">홈으로</Link>
      </div>
    )
  }

  // ── Loading (first poll not returned yet) ──────────────────────────────
  if (!job) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-6 animate-pulse" style={{ background: 'linear-gradient(135deg, #F97316, #FFB703)' }} aria-hidden="true" />
        <p className="text-gray-400 text-sm">연결 중…</p>
      </div>
    )
  }

  // ── Failed ─────────────────────────────────────────────────────────────
  if (job.status === 'failed') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
            <path d="M11 11l10 10M21 11L11 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">생성 실패</h1>
        <p className="text-sm text-gray-500 mb-8">{job.errorMessage ?? '알 수 없는 오류'}</p>
        <div className="flex flex-col gap-3">
          <button onClick={handleRetry} className="w-full py-4 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2">
            재시도 (크레딧 소모)
          </button>
          <Link href={`/t/${job.templateId}`} className="w-full py-4 border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl hover:border-gray-300 transition-colors text-center">
            템플릿으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  // ── Processing ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-6 animate-pulse" style={{ background: 'linear-gradient(135deg, #F97316, #FFB703)' }} aria-hidden="true" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">AI 라이브 포토 생성 중</h1>
          <p className="text-sm text-gray-400">잠시만 기다려주세요. 완료되면 자동으로 이동합니다.</p>
        </div>

        <ProgressStage progress={job.progress} />

        <div className="mt-10 text-center">
          <button
            onClick={() => setShowCancel(true)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
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
