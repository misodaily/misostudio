import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError, notFound, badRequest } from '@/lib/server/errors'
import { randomBytes } from 'crypto'

export async function POST(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data: job, error } = await admin
      .from('jobs')
      .select('status, share_token')
      .eq('job_id', params.jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !job) return notFound('잡을 찾을 수 없습니다.')
    if (job.status !== 'done') return badRequest('완료된 잡만 공유할 수 있습니다.')

    // Reuse existing token or generate new one
    let token = job.share_token
    if (!token) {
      token = randomBytes(12).toString('base64url')
      await admin
        .from('jobs')
        .update({ share_token: token })
        .eq('job_id', params.jobId)
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/result/${params.jobId}?share=${token}`

    return Response.json({ shareUrl, token })
  } catch (err) {
    return handleRouteError(err)
  }
}
