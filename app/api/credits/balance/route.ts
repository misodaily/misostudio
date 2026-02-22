import { requireUser } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/server/supabase'
import { handleRouteError } from '@/lib/server/errors'

export async function GET() {
  try {
    const user = await requireUser()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('profiles')
      .select('credit_balance')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      // Auto-create profile if missing (e.g. trigger didn't fire)
      await admin
        .from('profiles')
        .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })

      return Response.json({ balance: 15 })
    }

    return Response.json({ balance: data.credit_balance })
  } catch (err) {
    return handleRouteError(err)
  }
}
