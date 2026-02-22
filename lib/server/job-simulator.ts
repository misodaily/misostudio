/**
 * Deterministic, time-based job simulation.
 *
 * Progress is derived solely from (now - started_at), no external state.
 * Failure is determined by the first byte of job_id (≈10% rate).
 * GET /api/jobs/[jobId] calls this on every request and persists changes.
 */

const TOTAL_DURATION_MS = 8_000 // 8 seconds to 100%
const FAIL_BYTE_THRESHOLD = 26  // 26/256 ≈ 10.2% failure rate

export type SimulationResult = {
  status: 'processing' | 'done' | 'failed'
  progress: number
  errorMessage?: string
  previewVideoUrl?: string
  finishedAt?: string
}

/** Uses the first byte of the UUID (deterministic per job). */
export function shouldJobFail(jobId: string): boolean {
  const hex = jobId.replace(/-/g, '')
  const byte = parseInt(hex.slice(0, 2), 16) // 0–255
  return byte < FAIL_BYTE_THRESHOLD
}

export function computeJobSimulation(
  jobId: string,
  startedAt: string, // ISO timestamp
): SimulationResult {
  const elapsed = Date.now() - new Date(startedAt).getTime()
  const rawProgress = Math.min(
    100,
    Math.floor((elapsed / TOTAL_DURATION_MS) * 100),
  )

  const willFail = shouldJobFail(jobId)

  // Fail at ≥70% progress
  if (willFail && rawProgress >= 70) {
    return {
      status: 'failed',
      progress: 70,
      errorMessage:
        'AI 영상 생성 중 오류가 발생했습니다. 잠시 후 재시도해주세요.',
      finishedAt: new Date().toISOString(),
    }
  }

  if (rawProgress >= 100) {
    return {
      status: 'done',
      progress: 100,
      previewVideoUrl: '/sample.mp4',
      finishedAt: new Date().toISOString(),
    }
  }

  return {
    status: 'processing',
    progress: rawProgress,
  }
}

/** Maps progress (0–100) to Korean step description. */
export function progressToStepText(progress: number): string {
  if (progress <= 20) return '이미지 분석 중…'
  if (progress <= 60) return '모션 합성 중…'
  if (progress <= 90) return '렌더링 중…'
  return '마무리 중…'
}
