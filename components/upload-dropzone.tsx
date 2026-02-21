'use client'

import { useCallback, useRef, useState } from 'react'

type UploadDropzoneProps = {
  onFile: (file: File, dataUrl: string) => void
  preview: string | null
}

const MAX_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function UploadDropzone({ onFile, preview }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    (file: File) => {
      setError(null)

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('이미지 파일(JPG, PNG, WEBP, GIF)만 업로드 가능합니다.')
        return
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        onFile(file, dataUrl)
      }
      reader.readAsDataURL(file)
    },
    [onFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
      // Reset input value so same file can be re-selected
      e.target.value = ''
    },
    [processFile],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-sm mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="업로드된 이미지 미리보기"
          className="w-full h-full object-cover"
        />
        {/* Change overlay */}
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center group"
          aria-label="이미지 변경"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-gray-800 text-sm font-semibold px-4 py-2 rounded-full">
            이미지 변경
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleChange}
          className="sr-only"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label="이미지 업로드 영역. 클릭하거나 이미지를 드래그해서 올려주세요"
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed aspect-square cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2',
          isDragging
            ? 'border-[#F97316] bg-orange-50 scale-[1.01]'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50',
        ].join(' ')}
      >
        {/* Upload icon */}
        <div
          className={[
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
            isDragging ? 'bg-orange-100' : 'bg-white shadow-sm',
          ].join(' ')}
          aria-hidden="true"
        >
          <svg
            className={['w-7 h-7 transition-colors', isDragging ? 'text-[#F97316]' : 'text-gray-400'].join(' ')}
            viewBox="0 0 28 28"
            fill="none"
          >
            <path
              d="M14 18V10M14 10L10 14M14 10l4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="4"
              y="4"
              width="20"
              height="20"
              rx="6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="text-center px-6">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {isDragging ? '여기에 놓아주세요' : '이미지를 드래그하거나 클릭'}
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP · 최대 10MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleChange}
          className="sr-only"
          aria-label="파일 선택"
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500 text-center">
          {error}
        </p>
      )}
    </div>
  )
}
