import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError, notFound } from '@/lib/server/errors'
import { startRunwayTask } from '@/lib/server/runway'

export async function POST(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    // Fetch original job
    const { data: job, error } = await admin
      .from('jobs')
      .select('template_id, source_image_path, options')
      .eq('job_id', params.jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !job) return notFound('잡을 찾을 수 없습니다.')

    // Get template credit cost
    const { data: template } = await admin
      .from('templates')
      .select('credit_cost')
      .eq('id', job.template_id)
      .single()

    const baseCost = template?.credit_cost ?? 1
    const options = job.options as { durationSec?: number }
    const creditCost = baseCost + (options.durationSec === 5 ? 1 : 0)

    // Create new job (atomic credit deduction)
    const { data: newJobId, error: rpcErr } = await admin.rpc(
      'create_job_with_credit',
      {
        p_user_id: user.id,
        p_template_id: job.template_id,
        p_source_image_path: job.source_image_path,
        p_options: job.options,
        p_credit_cost: creditCost,
      },
    )

    if (rpcErr) throw new Error(rpcErr.message)

    // ── Kick off Runway generation for the new job ──────────────────────
    const { data: signedData } = await admin.storage
      .from('source-images')
      .createSignedUrl(job.source_image_path, 3600)

    if (signedData?.signedUrl) {
      try {
        const runwayTaskId = await startRunwayTask({
          sourceImageUrl: signedData.signedUrl,
          templateId: job.template_id,
          durationSec: options.durationSec ?? 5,
        })

        await admin
          .from('jobs')
          .update({ runway_task_id: runwayTaskId })
          .eq('job_id', newJobId)
      } catch (runwayErr) {
        console.error('[runway] Failed to start retry task:', runwayErr)
      }
    }
    // ──────────────────────────────────────────────────────────────────

    const { data: profile } = await admin
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', user.id)
      .single()

    return Response.json(
      { jobId: newJobId, creditBalance: profile?.credit_balance ?? 0 },
      { status: 201 },
    )
  } catch (err) {
    return handleRouteError(err)
  }
}
