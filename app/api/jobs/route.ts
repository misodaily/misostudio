import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError } from '@/lib/server/errors'
import { CreateJobSchema } from '@/lib/validators/jobs'
import { startRunwayTask } from '@/lib/server/runway'

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const { templateId, sourceImagePath, options } = CreateJobSchema.parse(body)

    const admin = createAdminClient()

    // Fetch template for credit cost
    const { data: template, error: tmplErr } = await admin
      .from('templates')
      .select('credit_cost, is_active')
      .eq('id', templateId)
      .single()

    if (tmplErr || !template) {
      return Response.json(
        { error: { code: 'NOT_FOUND', message: '템플릿을 찾을 수 없습니다.' } },
        { status: 404 },
      )
    }

    if (!template.is_active) {
      return Response.json(
        { error: { code: 'TEMPLATE_INACTIVE', message: '비활성 템플릿입니다.' } },
        { status: 400 },
      )
    }

    const creditCost = template.credit_cost

    // Atomic: deduct credit + create job (via Postgres function)
    const { data: jobId, error: rpcErr } = await admin.rpc(
      'create_job_with_credit',
      {
        p_user_id: user.id,
        p_template_id: templateId,
        p_source_image_path: sourceImagePath,
        p_options: options,
        p_credit_cost: creditCost,
      },
    )

    if (rpcErr) throw new Error(rpcErr.message)

    // ── Kick off Runway generation ─────────────────────────────────────────
    // Generate a 1-hour signed URL for Runway to download the source image
    const { data: signedData, error: signErr } = await admin.storage
      .from('source-images')
      .createSignedUrl(sourceImagePath, 3600)

    console.log('[jobs] signedUrl:', signedData?.signedUrl ? '생성됨' : '실패', signErr ?? '')

    if (signedData?.signedUrl) {
      try {
        const runwayTaskId = await startRunwayTask({
          sourceImageUrl: signedData.signedUrl,
          templateId,
          durationSec: options.durationSec,
        })

        console.log('[jobs] runwayTaskId:', runwayTaskId)

        const { error: updateErr } = await admin
          .from('jobs')
          .update({ runway_task_id: runwayTaskId })
          .eq('job_id', jobId)

        if (updateErr) console.error('[jobs] runway_task_id 저장 실패:', updateErr)
      } catch (runwayErr) {
        console.error('[runway] Failed to start task:', runwayErr)
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    // Fetch new credit balance to return to client
    const { data: profile } = await admin
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', user.id)
      .single()

    return Response.json(
      { jobId, creditBalance: profile?.credit_balance ?? 0 },
      { status: 201 },
    )
  } catch (err) {
    return handleRouteError(err)
  }
}
