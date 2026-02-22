'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ResultPreview } from '@/components/result-preview'
import { useToast } from '@/components/toast-provider'
import { getTemplateById } from '@/lib/templates'
import { formatDate } from '@/lib/utils'

type JobData = {
  jobId: string
  templateId: string
  status: string
  createdAt: string
  previewVideoUrl: string | null
  sourceImageUrl: string | null
}

export default function ResultPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()
  const toast = useToast()

  const [job, setJob] = useState<JobData | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (res.status === 404) { setNotFound(true); return }
        if (res.status === 401) { router.push('/auth/login'); return }
        if (!res.ok) return
        const data = await res.json()
        const j = data.job
        setJob({
          jobId: j.jobId,
          templateId: j.templateId,
          status: j.status,
          createdAt: j.created_at,
          previewVideoUrl: j.previewVideoUrl ?? null,
          sourceImageUrl: j.sourceImageUrl ?? null,
        })
      } catch { /* ignore */ }
    }
    fetchJob()
  }, [jobId, router])

  const template = job ? getTemplateById(job.templateId) : undefined

  async function handleShare() {
    try {
      const res = await fetch(`/api/jobs/${jobId}/share`, { method: 'POST' })
      const url = res.ok ? (await res.json()).shareUrl : window.location.href
      await navigator.clipboard.writeText(url)
      toast('공유 링크가 복사되었습니다!', 'success')
    } catch {
      toast('공유 링크 복사에 실패했습니다.', 'error')
    }
  }

  function handleDownload() {
    if (!job?.previewVideoUrl) {
      toast('다운로드할 영상이 없습니다.', 'error')
      return
    }
    const a = document.createElement('a')
    a.href = `/api/jobs/${jobId}/download`
    a.download = `miso-studio-${jobId}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast('다운로드를 시작합니다!', 'success')
  }

  function handleRetry() {
    if (!job) return
    router.push(`/t/${job.templateId}`)
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-bold text-gray-900">결과를 찾을 수 없습니다</h1>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div
          className="w-16 h-16 rounded-3xl mx-auto mb-6 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #F97316, #FFB703)' }}
          aria-hidden="true"
        />
        <p className="text-gray-400 text-sm">불러오는 중…</p>
      </div>
    )
  }

  if (job.status !== 'done' || !job.previewVideoUrl) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-5xl" aria-hidden="true">⏳</p>
        <h1 className="text-xl font-bold text-gray-900">아직 완료되지 않았습니다</h1>
        <p className="text-sm text-gray-500">상태: {job.status}</p>
        <Link
          href={`/create/${jobId}`}
          className="px-5 py-2.5 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors"
        >
          진행 상황 확인
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-lg"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          홈
        </Link>
        <span className="text-gray-200" aria-hidden="true">/</span>
        <span className="text-sm text-gray-500">결과</span>
      </div>

      {/* Success badge */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M6.5 10l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900">영상 생성 완료!</h1>
          <p className="text-xs text-gray-400">
            {template?.titleKo} · {formatDate(new Date(job.createdAt).getTime())}
          </p>
        </div>
      </div>

      {/* Preview & actions */}
      <ResultPreview
        sourceImageDataUrl={job.sourceImageUrl ?? ''}
        previewVideoUrl={job.previewVideoUrl}
        onShare={handleShare}
        onDownload={handleDownload}
        onRetry={handleRetry}
      />

      {/* Bottom CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-gray-100 pt-8">
        <p className="text-sm text-gray-400">
          마음에 드셨나요? 더 많은 템플릿을 탐색해보세요.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#F97316] hover:text-[#F97316] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
        >
          템플릿 더 보기
        </Link>
      </div>
    </div>
  )
}
