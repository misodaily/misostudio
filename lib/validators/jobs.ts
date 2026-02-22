import { z } from 'zod'

export const CreateJobSchema = z.object({
  templateId: z.string().min(1, '템플릿 ID가 필요합니다.'),
  sourceImagePath: z.string().min(1, '이미지 경로가 필요합니다.'),
  options: z.object({
    durationSec: z.literal(5),
  }),
})

export type CreateJobInput = z.infer<typeof CreateJobSchema>

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})
