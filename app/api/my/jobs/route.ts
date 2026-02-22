import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError } from '@/lib/server/errors'
import { PaginationSchema } from '@/lib/validators/jobs'

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)

    const { limit, offset } = PaginationSchema.parse({
      limit: searchParams.get('limit') ?? 20,
      offset: searchParams.get('offset') ?? 0,
    })

    const admin = createAdminClient()

    const { data: jobs, error, count } = await admin
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Attach signed source image URLs
    const jobsWithUrls = await Promise.all(
      (jobs ?? []).map(async (job) => {
        let sourceImageUrl: string | null = null
        if (job.source_image_path) {
          const { data } = await admin.storage
            .from('source-images')
            .createSignedUrl(job.source_image_path, 3600)
          sourceImageUrl = data?.signedUrl ?? null
        }
        return {
          ...job,
          jobId: job.job_id,
          templateId: job.template_id,
          sourceImageUrl,
          previewVideoUrl: job.preview_video_url ?? null,
          errorMessage: job.error_message ?? null,
        }
      }),
    )

    return Response.json({
      jobs: jobsWithUrls,
      total: count ?? 0,
      limit,
      offset,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
