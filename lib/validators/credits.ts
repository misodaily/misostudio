import { z } from 'zod'

export const TopupSchema = z.object({
  amount: z.union([z.literal(10), z.literal(30), z.literal(50)], {
    error: '충전 가능한 크레딧은 10, 30, 50 중 하나입니다.',
  }),
})

export type TopupInput = z.infer<typeof TopupSchema>
