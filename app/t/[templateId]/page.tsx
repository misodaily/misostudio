'use client'

import { useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getTemplateById } from '@/lib/templates'
import { useStore, useCreditBalance, type CreateOptions } from '@/lib/store'
import { UploadDropzone } from '@/components/upload-dropzone'
import { OptionsPanel } from '@/components/options-panel'
import { useToast } from '@/components/toast-provider'

const DEFAULT_OPTIONS: CreateOptions = {
  durationSec: 5,
  intensity: 'mid',
  keepFirstFrame: true,
}

export default function TemplatePage() {
  const { templateId } = useParams<{ templateId: string }>()
  const router = useRouter()
  const toast = useToast()
  const { createJob, spendCredits } = useStore()
  const creditBalance = useCreditBalance()

  const template = getTemplateById(templateId)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [options, setOptions] = useState<CreateOptions>(DEFAULT_OPTIONS)
  const [isStarting, setIsStarting] = useState(false)

  // Effective credit cost: base + extra for 5s
  const effectiveCost =
    (template?.creditCost ?? 1) + (options.durationSec === 5 ? 1 : 0)

  const canGenerate = !!imageDataUrl && creditBalance >= effectiveCost

  const handleFile = useCallback((file: File, dataUrl: string) => {
    setImageFile(file)
    setImageDataUrl(dataUrl)
    toast('이미지 업로드 완료!', 'success')
  }, [toast])

  async function handleGenerate() {
    if (!imageDataUrl || !template) return
    if (creditBalance < effectiveCost) {
      toast(`크레딧이 부족합니다. (필요: ${effectiveCost}, 잔액: ${creditBalance})`, 'error')
      return
    }

    setIsStarting(true)

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 300))

    spendCredits(effectiveCost)
    const jobId = createJob(template.id, imageDataUrl, options)

    toast('생성을 시작합니다!', 'success')
    router.push(`/create/${jobId}`)
  }

  if (!template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-6xl" aria-hidden="true">✦</p>
        <h1 className="text-xl font-bold text-gray-900">템플릿을 찾을 수 없습니다</h1>
        <Link
          href="/"
          className="px-5 py-2.5 bg-[#F97316] text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] rounded-lg"
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
        템플릿 목록
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left: Template info + Upload */}
        <div className="space-y-8">
          {/* Template info */}
          <div>
            {/* Accent title */}
            <p
              className="font-black text-5xl sm:text-6xl tracking-tighter leading-none mb-3"
              style={{ color: template.textDark ? template.accentColor : template.accentColor }}
              aria-label={`${template.titleEn} 템플릿`}
            >
              {template.titleEn}
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {template.titleKo}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {template.description}
            </p>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold capitalize">
                {template.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-50 text-[#F97316] text-xs font-semibold">
                기본 {template.creditCost}크레딧
              </span>
            </div>
          </div>

          {/* Upload */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              사진 업로드
              <span className="text-red-400 ml-1">*</span>
            </p>
            <UploadDropzone onFile={handleFile} preview={imageDataUrl} />
          </div>
        </div>

        {/* Right: Options + CTA */}
        <div className="space-y-8">
          {/* Options */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-5">생성 옵션</p>
            <OptionsPanel options={options} onChange={setOptions} />
          </div>

          {/* Generate CTA */}
          <div className="sticky bottom-4 sm:static">
            <div className="bg-white sm:bg-transparent border border-gray-100 sm:border-0 rounded-3xl p-4 sm:p-0 shadow-xl shadow-black/5 sm:shadow-none">
              {/* Credit summary */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">소모 크레딧</span>
                  <span className="text-lg font-black text-[#F97316]">
                    {effectiveCost}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5 text-[#F97316]" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="8" r="7" />
                  </svg>
                  잔액 {creditBalance}
                </div>
              </div>

              {/* Low credit warning */}
              {creditBalance < effectiveCost && (
                <p className="text-xs text-red-500 mb-3" role="alert">
                  크레딧이 부족합니다.{' '}
                  <Link href="/my" className="underline font-semibold">
                    충전하러 가기
                  </Link>
                </p>
              )}

              {/* No image warning */}
              {!imageDataUrl && (
                <p className="text-xs text-gray-400 mb-3">
                  이미지를 먼저 업로드해주세요.
                </p>
              )}

              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isStarting}
                aria-label={
                  !imageDataUrl
                    ? '이미지를 먼저 업로드해주세요'
                    : creditBalance < effectiveCost
                    ? '크레딧이 부족합니다'
                    : '영상 생성하기'
                }
                className={[
                  'w-full py-4 rounded-2xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2',
                  canGenerate && !isStarting
                    ? 'bg-[#F97316] text-white hover:bg-orange-600 shadow-lg shadow-orange-200 active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                {isStarting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="8" />
                    </svg>
                    생성 준비 중…
                  </span>
                ) : (
                  '✦ 영상 생성하기'
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                생성에는 약 6~10초가 소요됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
