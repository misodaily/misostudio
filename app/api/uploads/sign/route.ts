import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError } from '@/lib/server/errors'
import { SignUploadSchema } from '@/lib/validators/uploads'

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const { fileName, mimeType } = SignUploadSchema.parse(body)

    // Store under user's own folder for RLS
    const ext = fileName.split('.').pop() ?? 'jpg'
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const admin = createAdminClient()
    const { data, error } = await admin.storage
      .from('source-images')
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      throw new Error('Signed URL 생성에 실패했습니다.')
    }

    return Response.json({
      signedUrl: data.signedUrl,
      storagePath,
      token: data.token,
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
