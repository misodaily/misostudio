/**
 * Cancel policy: 취소 시 크레딧 전액 환불
 * (queued/processing 상태만 취소 가능)
 */
import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError, notFound } from '@/lib/server/errors'

export async function POST(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    // Fetch job to get template for credit cost
    const { data: job, error } = await admin
      .from('jobs')
      .select('status, template_id, options')
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

    const { error: rpcErr } = await admin.rpc('cancel_job_with_refund', {
      p_job_id: params.jobId,
      p_user_id: user.id,
      p_credit_cost: creditCost,
    })

    if (rpcErr) throw new Error(rpcErr.message)

    // Return updated balance
    const { data: profile } = await admin
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', user.id)
      .single()

    return Response.json({ canceled: true, creditBalance: profile?.credit_balance ?? 0 })
  } catch (err) {
    return handleRouteError(err)
  }
}
