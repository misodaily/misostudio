import { createAdminClient } from '@/lib/server/supabase'
import { TEMPLATES } from '@/lib/templates'

export const revalidate = 60

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data?.length) {
      // Fallback to static data
      return Response.json({ templates: TEMPLATES })
    }

    return Response.json({ templates: data })
  } catch {
    return Response.json({ templates: TEMPLATES })
  }
}
