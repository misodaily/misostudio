import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError } from '@/lib/server/errors'

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data: job } = await admin
      .from('jobs')
      .select('preview_video_url, status, job_id')
      .eq('job_id', params.jobId)
      .eq('user_id', user.id)
      .single()

    if (!job || job.status !== 'done' || !job.preview_video_url) {
      return new Response('Not found', { status: 404 })
    }

    const videoRes = await fetch(job.preview_video_url)
    if (!videoRes.ok) {
      return new Response('Video not available', { status: 502 })
    }

    const contentType = videoRes.headers.get('content-type') ?? 'video/mp4'

    return new Response(videoRes.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="miso-studio-${params.jobId}.mp4"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
