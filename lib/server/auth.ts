import { createCookieClient } from './supabase'
import type { User } from '@supabase/supabase-js'

export class AuthError extends Error {
  constructor(message = '인증이 필요합니다.') {
    super(message)
    this.name = 'AuthError'
  }
}

/** Returns the current user or null (no throw). */
export async function getUser(): Promise<User | null> {
  const supabase = createCookieClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Returns the current user or throws AuthError (use in protected routes). */
export async function requireUser(): Promise<User> {
  const user = await getUser()
  if (!user) throw new AuthError()
  return user
}
