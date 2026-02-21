'use client'

import { useRef, useState } from 'react'

type ResultPreviewProps = {
  sourceImageDataUrl: string
  previewVideoUrl: string
  onShare: () => void
  onDownload: () => void
  onRetry: () => void
}

export function ResultPreview({
  sourceImageDataUrl,
  previewVideoUrl,
  onShare,
  onDownload,
  onRetry,
}: ResultPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source image */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            원본 이미지
          </p>
          <div className="rounded-2xl overflow-hidden aspect-square bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sourceImageDataUrl}
              alt="원본 업로드 이미지"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Result video */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            생성된 영상
          </p>
          <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-900">
            {!videoError ? (
              <>
                <video
                  ref={videoRef}
                  src={previewVideoUrl}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onError={() => setVideoError(true)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  aria-label="생성된 AI 영상"
                />
                {/* Play/pause overlay */}
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? '일시정지' : '재생'}
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors group"
                >
                  <span className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    {isPlaying ? (
                      <svg className="w-5 h-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                        <rect x="5" y="4" width="3" height="12" rx="1" />
                        <rect x="12" y="4" width="3" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-800 translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 4l12 6-12 6V4z" />
                      </svg>
                    )}
                  </span>
                </button>
              </>
            ) : (
              /* Placeholder when video fails */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div
                  className="w-16 h-16 rounded-2xl animate-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #F97316, #FFB703)',
                  }}
                  aria-hidden="true"
                />
                <p className="text-white/60 text-xs text-center px-4">
                  영상 미리보기
                  <br />
                  (sample.mp4 파일을 public/에 추가하세요)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 text-sm font-semibold text-gray-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          aria-label="공유 링크 복사"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M10.5 5.5L13 8l-2.5 2.5M13 8H6M5.5 3.5H4a1.5 1.5 0 00-1.5 1.5v6A1.5 1.5 0 004 12.5h1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          공유 링크 복사
        </button>

        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 text-sm font-semibold text-gray-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
          aria-label="영상 다운로드"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3v7M5 7l3 3 3-3M3.5 12.5h9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          다운로드
        </button>

        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#F97316] hover:bg-orange-600 text-white text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2"
          aria-label="다시 만들기"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path
              d="M2.5 8A5.5 5.5 0 0113 5.5M13.5 8A5.5 5.5 0 013 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path d="M11 3.5l2 2-2 2M5 8.5l-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          다시 만들기
        </button>
      </div>
    </div>
  )
}
