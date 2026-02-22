import { z } from 'zod'

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const SignUploadSchema = z.object({
  fileName: z.string().min(1, '파일명이 필요합니다.').max(200),
  mimeType: z.enum(ALLOWED_MIME, {
    error: '이미지 파일(JPG, PNG, WEBP, GIF)만 허용됩니다.',
  }),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, '파일 크기는 10MB 이하여야 합니다.'),
})

export type SignUploadInput = z.infer<typeof SignUploadSchema>
