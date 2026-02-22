import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError, notFound } from '@/lib/server/errors'
import { getRunwayTaskStatus } from '@/lib/server/runway'

async function getSignedImageUrl(
  admin: ReturnType<typeof createAdminClient>,
  path: string | null,
): Promise<string | null> {
  if (!path) return null
  const { data } = await admin.storage
    .from('source-images')
    .createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

// 실패한 job의 크레딧 환불 (중복 환불 방지 포함)
async function refundJobCredits(
  admin: ReturnType<typeof createAdminClient>,
  jobId: string,
  userId: string,
) {
  // 이미 환불된 경우 스킵
  const { data: existing } = await admin
    .from('credit_ledger')
    .select('id')
    .eq('job_id', jobId)
    .eq('reason', 'refund')
    .maybeSingle()
  if (existing) return

  // 원래 차감된 크레딧 조회
  const { data: spend } = await admin
    .from('credit_ledger')
    .select('amount')
    .eq('job_id', jobId)
    .eq('reason', 'spend')
    .maybeSingle()
  if (!spend) return

  const refundAmount = Math.abs(spend.amount)

  // 현재 잔액 조회 후 환불
  const { data: profile } = await admin
    .from('profiles')
    .select('credit_balance')
    .eq('user_id', userId)
    .single()
  if (!profile) return

  await admin
    .from('profiles')
    .update({ credit_balance: profile.credit_balance + refundAmount })
    .eq('user_id', userId)

  await admin
    .from('credit_ledger')
    .insert({ user_id: userId, amount: refundAmount, reason: 'refund', job_id: jobId })

  console.log(`[jobs] refunded ${refundAmount} credit(s) for failed job ${jobId}`)
}

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data: job, error } = await admin
      .from('jobs')
      .select('*')
      .eq('job_id', params.jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !job) return notFound('잡을 찾을 수 없습니다.')

    let updatedJob = { ...job }

    // ── Poll Runway if job is still in-progress ──────────────────────────
    if (job.status === 'processing' || job.status === 'queued') {
      const runwayTaskId = (job as { runway_task_id?: string }).runway_task_id

      if (runwayTaskId) {
        try {
          const result = await getRunwayTaskStatus(
            runwayTaskId,
            job.started_at ?? job.created_at,
          )

          const patch: Record<string, unknown> = {}

          if (result.status === 'succeeded') {
            // Runway URL을 Supabase Storage에 영구 저장 (Runway URL은 만료됨)
            let storedVideoUrl: string | null = result.videoUrl ?? null
            if (result.videoUrl) {
              try {
                const videoRes = await fetch(result.videoUrl)
                if (videoRes.ok) {
                  const videoBuffer = await videoRes.arrayBuffer()
                  const storagePath = `videos/${job.job_id}.mp4`
                  const { data: uploadData, error: uploadErr } = await admin.storage
                    .from('preview-videos')
                    .upload(storagePath, videoBuffer, {
                      contentType: 'video/mp4',
                      upsert: true,
                    })
                  if (uploadErr) {
                    console.error('[jobs] video upload to storage failed:', uploadErr)
                  } else if (uploadData) {
                    const { data: { publicUrl } } = admin.storage
                      .from('preview-videos')
                      .getPublicUrl(uploadData.path)
                    storedVideoUrl = publicUrl
                    console.log('[jobs] video saved to storage:', publicUrl)
                  }
                }
              } catch (uploadErr) {
                console.error('[jobs] video fetch/upload error:', uploadErr)
                // Runway URL을 fallback으로 사용
              }
            }

            patch.status = 'done'
            patch.progress = 100
            patch.preview_video_url = storedVideoUrl
            patch.finished_at = new Date().toISOString()
          } else if (result.status === 'failed') {
            patch.status = 'failed'
            patch.progress = result.progress
            patch.error_message = result.errorMessage
            patch.finished_at = new Date().toISOString()
            // 생성 실패 시 크레딧 자동 환불
            await refundJobCredits(admin, job.job_id, job.user_id)
          } else {
            // PENDING / RUNNING / THROTTLED — 진행 중
            if (result.progress !== job.progress) {
              patch.progress = result.progress
            }
            if (result.status === 'running' && job.status === 'queued') {
              patch.status = 'processing'
            }
          }

          if (Object.keys(patch).length > 0) {
            await admin
              .from('jobs')
              .update(patch)
              .eq('job_id', job.job_id)

            updatedJob = { ...updatedJob, ...patch }
          }
        } catch (runwayErr) {
          // Runway 상태 조회 실패 시 job을 실패로 처리하지 않고 다음 폴링에서 재시도
          console.error('[runway] status check failed, will retry:', runwayErr)
        }
      } else {
        // runway_task_id가 없음 — Runway 작업 시작 실패 케이스
        // 생성에 최대 3분 소요될 수 있으므로 180초 유예 후 실패 처리
        const createdAt = new Date(job.started_at ?? job.created_at).getTime()
        const elapsedSec = (Date.now() - createdAt) / 1000
        if (elapsedSec > 180) {
          const patch = {
            status: 'failed',
            error_message: '영상 생성을 시작하지 못했습니다. 다시 시도해주세요.',
            finished_at: new Date().toISOString(),
          }
          await admin.from('jobs').update(patch).eq('job_id', job.job_id)
          updatedJob = { ...updatedJob, ...patch }
          // Runway 작업 시작 실패 시 크레딧 자동 환불
          await refundJobCredits(admin, job.job_id, job.user_id)
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────

    // Attach signed source image URL
    const sourceImageUrl = await getSignedImageUrl(
      admin,
      updatedJob.source_image_path,
    )

    return Response.json({
      job: {
        ...updatedJob,
        sourceImageUrl,
        jobId: updatedJob.job_id,
        templateId: updatedJob.template_id,
        options: updatedJob.options,
        previewVideoUrl: updatedJob.preview_video_url ?? null,
        errorMessage: updatedJob.error_message ?? null,
      },
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
