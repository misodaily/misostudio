'use client'

import type { CreateOptions } from '@/lib/store'

type OptionsPanelProps = {
  options: CreateOptions
  onChange: (next: CreateOptions) => void
}

const INTENSITY_OPTIONS = [
  { value: 'low' as const, label: '약하게', desc: '자연스럽고 미세한 움직임' },
  { value: 'mid' as const, label: '보통', desc: '밸런스 잡힌 모션' },
  { value: 'high' as const, label: '강하게', desc: '극적이고 역동적인 효과' },
]

export function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  return (
    <div className="space-y-6" role="group" aria-label="생성 옵션">
      {/* Duration */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          영상 길이
        </label>
        <div className="flex gap-2" role="radiogroup" aria-label="영상 길이 선택">
          {([3, 5] as const).map((sec) => (
            <label
              key={sec}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all',
                options.durationSec === sec
                  ? 'border-[#F97316] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300',
              ].join(' ')}
            >
              <input
                type="radio"
                name="duration"
                value={sec}
                checked={options.durationSec === sec}
                onChange={() => onChange({ ...options, durationSec: sec })}
                className="sr-only"
              />
              <span
                className={[
                  'text-sm font-bold',
                  options.durationSec === sec ? 'text-[#F97316]' : 'text-gray-600',
                ].join(' ')}
              >
                {sec}초
              </span>
              {sec === 3 && (
                <span className="text-xs text-gray-400">(1크레딧)</span>
              )}
              {sec === 5 && (
                <span className="text-xs text-gray-400">(2크레딧)</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          모션 강도
        </label>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="모션 강도 선택">
          {INTENSITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={[
                'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                options.intensity === opt.value
                  ? 'border-[#F97316] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300',
              ].join(' ')}
            >
              <input
                type="radio"
                name="intensity"
                value={opt.value}
                checked={options.intensity === opt.value}
                onChange={() => onChange({ ...options, intensity: opt.value })}
                className="sr-only"
              />
              {/* Radio indicator */}
              <span
                className={[
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  options.intensity === opt.value
                    ? 'border-[#F97316]'
                    : 'border-gray-300',
                ].join(' ')}
                aria-hidden="true"
              >
                {options.intensity === opt.value && (
                  <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                )}
              </span>
              <div>
                <p
                  className={[
                    'text-sm font-semibold',
                    options.intensity === opt.value
                      ? 'text-[#F97316]'
                      : 'text-gray-700',
                  ].join(' ')}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-gray-400">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Keep First Frame */}
      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200">
        <div>
          <p className="text-sm font-semibold text-gray-700">첫 프레임 고정</p>
          <p className="text-xs text-gray-400 mt-0.5">
            업로드한 이미지를 영상 시작점으로 고정합니다
          </p>
        </div>
        <button
          role="switch"
          aria-checked={options.keepFirstFrame}
          aria-label="첫 프레임 고정"
          onClick={() =>
            onChange({ ...options, keepFirstFrame: !options.keepFirstFrame })
          }
          className={[
            'relative w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316] focus-visible:ring-offset-2 shrink-0',
            options.keepFirstFrame ? 'bg-[#F97316]' : 'bg-gray-200',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
              options.keepFirstFrame ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  )
}
