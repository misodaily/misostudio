'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCreditBalance } from '@/lib/store'
import { getTemplateById } from '@/lib/templates'
import { formatDate } from '@/lib/utils'

type JobStatus = 'queued' | 'processing' | 'done' | 'failed' | 'canceled'

type JobItem = {
  id: string
  templateId: string
  status: JobStatus
  createdAt: string
  options: { durationSec: number; intensity: string }
  sourceImageUrl: string | null
}

// ── Status badge ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<JobStatus, { label: string; color: string }> = {
  queued: { label: '대기 중', color: 'bg-gray-100 text-gray-500' },
  processing: { label: '생성 중', color: 'bg-blue-50 text-blue-500' },
  done: { label: '완료', color: 'bg-emerald-50 text-emerald-600' },
  failed: { label: '실패', color: 'bg-red-50 text-red-500' },
  canceled: { label: '취소됨', color: 'bg-gray-100 text-gray-400' },
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
  const creditBalance = useCreditBalance()
  const [jobs, setJobs] = useState<JobItem[] | null>(null)

  useEffect(() => {
    fetch('/api/my/jobs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setJobs(data?.jobs ?? []))
      .catch(() => setJobs([]))
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">내 기록</h1>
          <p className="text-sm text-gray-400">생성한 영상 기록을 확인합니다.</p>
        </div>

        {/* Credit card */}
        {creditBalance !== null && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-50 border border-orange-100">
            <svg className="w-4 h-4 text-[#F97316]" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="7" />
            </svg>
            <span className="text-sm font-black text-gray-900">{creditBalance}</span>
            <span className="text-xs text-gray-500">크레딧</span>
          </div>
        )}
      </div>

      {/* History list */}
      {jobs === null ? (
        <div className="py-20 text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-4 animate-pulse"
            style={{ background: 'linear-gradient(135deg, #F97316, #FFB703)' }}
            aria-hidden="true"
          />
          <p className="text-sm text-gray-400">불러오는 중…</p>
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3" role="list" aria-label="생성 기록">
          {jobs.map((job) => {
            const template = getTemplateById(job.templateId)
            const status = STATUS_MAP[job.status] ?? STATUS_MAP.failed
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
                  {job.sourceImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.sourceImageUrl}
                      alt={`${template?.titleKo ?? '알 수 없음'} 원본 이미지`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
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
                    {formatDate(new Date(job.createdAt).getTime())} · {job.options.durationSec}초 · {job.options.intensity}
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
              <div key={job.id} role="listitem">
                {isClickable ? (
                  <Link
                    href={`/result/${job.id}`}
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
  )
}
