'use client'

type ProgressStageProps = {
  progress: number // 0–100
}

function getStepText(progress: number): string {
  if (progress <= 20) return '이미지 분석 중…'
  if (progress <= 60) return '모션 합성 중…'
  if (progress <= 90) return '렌더링 중…'
  return '마무리 중…'
}

function getStepIndex(progress: number): number {
  if (progress <= 20) return 0
  if (progress <= 60) return 1
  if (progress <= 90) return 2
  return 3
}

const STEPS = ['이미지 분석', '모션 합성', '렌더링', '마무리']

export function ProgressStage({ progress }: ProgressStageProps) {
  const stepText = getStepText(progress)
  const stepIndex = getStepIndex(progress)

  return (
    <div className="w-full space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between" role="list" aria-label="생성 단계">
        {STEPS.map((step, i) => {
          const isDone = i < stepIndex
          const isActive = i === stepIndex
          return (
            <div
              key={step}
              role="listitem"
              className="flex flex-col items-center gap-1.5 flex-1"
              aria-current={isActive ? 'step' : undefined}
            >
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500',
                  isDone
                    ? 'bg-[#F97316] text-white'
                    : isActive
                    ? 'bg-orange-100 ring-2 ring-[#F97316] ring-offset-2'
                    : 'bg-gray-100 text-gray-300',
                ].join(' ')}
                aria-hidden="true"
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 7l3 3 5-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    className={[
                      'w-2 h-2 rounded-full',
                      isActive ? 'bg-[#F97316] animate-pulse' : 'bg-gray-300',
                    ].join(' ')}
                  />
                )}
              </div>
              <span
                className={[
                  'text-xs font-medium hidden sm:block',
                  isActive ? 'text-[#F97316]' : isDone ? 'text-gray-500' : 'text-gray-300',
                ].join(' ')}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p
            className="text-sm font-semibold text-gray-700"
            aria-live="polite"
            aria-atomic="true"
          >
            {stepText}
          </p>
          <span className="text-sm font-bold text-[#F97316]">{progress}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="생성 진행률"
          className="h-2 bg-gray-100 rounded-full overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #F97316, #FFB703)',
            }}
          />
        </div>
      </div>

      {/* Skeleton shimmer placeholders */}
      <div className="space-y-2.5" aria-hidden="true">
        {[70, 85, 55].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-gray-100 animate-pulse"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </div>
  )
}
