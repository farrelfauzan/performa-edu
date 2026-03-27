import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UpdateQuizSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    timeLimitSecs: z.coerce.number().int().positive().nullable().optional(),
    passingScore: z.coerce.number().int().min(0).max(100).optional(),
    maxAttempts: z.coerce.number().int().min(1).optional(),
    shuffleQuestions: z.boolean().optional(),
    clearTimeLimit: z.boolean().optional(),
  })
  .meta({ className: 'UpdateQuizDto' });

export class UpdateQuizDto extends createZodDto(UpdateQuizSchema) {}

export type UpdateQuizType = z.infer<typeof UpdateQuizSchema>;
