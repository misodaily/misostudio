import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError } from '@/lib/server/errors'
import { TopupSchema } from '@/lib/validators/credits'

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    const { amount } = TopupSchema.parse(body)

    const admin = createAdminClient()

    const { data, error } = await admin.rpc('topup_credits', {
      p_user_id: user.id,
      p_amount: amount,
    })

    if (error) throw new Error(error.message)

    return Response.json({ balance: data as number })
  } catch (err) {
    return handleRouteError(err)
  }
}
