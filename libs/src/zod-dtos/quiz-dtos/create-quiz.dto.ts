import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const QuestionTypeSchema = z.coerce.number().min(0).max(3);

const CreateOptionInputSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const CreateQuestionInputSchema = z.object({
  type: QuestionTypeSchema,
  text: z.string().min(1, 'Question text is required'),
  explanation: z.string().optional(),
  pictureUrl: z.string().url().optional(),
  points: z.coerce.number().int().min(0).max(100).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  options: z.array(CreateOptionInputSchema).default([]),
});

export const CreateQuizSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    timeLimitSecs: z.coerce.number().int().positive().optional(),
    passingScore: z.coerce.number().int().min(0).max(100).optional(),
    maxAttempts: z.coerce.number().int().min(1).optional(),
    shuffleQuestions: z.boolean().optional(),
    questions: z.array(CreateQuestionInputSchema).default([]),
  })
  .meta({ className: 'CreateQuizDto' });

export class CreateQuizDto extends createZodDto(CreateQuizSchema) {}

export type CreateQuizType = z.infer<typeof CreateQuizSchema>;
