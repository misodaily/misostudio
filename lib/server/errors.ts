import { AuthError } from './auth'
import { ZodError } from 'zod'

type ErrorBody = { error: { code: string; message: string } }

export function apiError(
  code: string,
  message: string,
  status: number,
): Response {
  return Response.json({ error: { code, message } } satisfies ErrorBody, {
    status,
  })
}

export const unauthorized = (msg = '인증이 필요합니다.') =>
  apiError('UNAUTHORIZED', msg, 401)

export const forbidden = (msg = '권한이 없습니다.') =>
  apiError('FORBIDDEN', msg, 403)

export const notFound = (msg = '리소스를 찾을 수 없습니다.') =>
  apiError('NOT_FOUND', msg, 404)

export const badRequest = (msg: string) =>
  apiError('BAD_REQUEST', msg, 400)

export const conflict = (msg: string) =>
  apiError('CONFLICT', msg, 409)

export const serverError = (msg = '서버 오류가 발생했습니다.') =>
  apiError('INTERNAL_ERROR', msg, 500)

/** Centralised error handler for all API routes. */
export function handleRouteError(err: unknown): Response {
  if (err instanceof AuthError) return unauthorized(err.message)
  if (err instanceof ZodError) {
    return badRequest(err.issues[0]?.message ?? '입력값이 올바르지 않습니다.')
  }
  if (err instanceof Error) {
    // Known domain errors thrown as plain Error with specific messages
    const msg = err.message
    if (msg === 'INSUFFICIENT_CREDITS')
      return apiError('INSUFFICIENT_CREDITS', '크레딧이 부족합니다.', 402)
    if (msg === 'PROFILE_NOT_FOUND')
      return notFound('프로필을 찾을 수 없습니다.')
    if (msg === 'JOB_NOT_CANCELABLE')
      return badRequest('취소할 수 없는 상태입니다.')
  }
  console.error('[api error]', err)
  return serverError()
}
