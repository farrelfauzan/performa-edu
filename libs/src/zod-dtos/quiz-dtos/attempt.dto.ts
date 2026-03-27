import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const SubmitAnswerSchema = z
  .object({
    questionId: z.string().min(1, 'Question ID is required'),
    selectedOptionIds: z.array(z.string()).default([]),
    textAnswer: z.string().optional(),
  })
  .meta({ className: 'SubmitAnswerDto' });

export class SubmitAnswerDto extends createZodDto(SubmitAnswerSchema) {}
