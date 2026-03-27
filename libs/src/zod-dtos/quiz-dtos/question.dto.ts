import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { QuestionTypeSchema } from './create-quiz.dto';

const CreateOptionInputSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const AddQuestionSchema = z
  .object({
    type: QuestionTypeSchema,
    text: z.string().min(1, 'Question text is required'),
    explanation: z.string().optional(),
    pictureUrl: z.string().url().optional(),
    points: z.coerce.number().int().min(0).max(100).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    options: z.array(CreateOptionInputSchema).default([]),
  })
  .meta({ className: 'AddQuestionDto' });

export class AddQuestionDto extends createZodDto(AddQuestionSchema) {}

export const UpdateQuestionSchema = z
  .object({
    type: QuestionTypeSchema.optional(),
    text: z.string().min(1).optional(),
    explanation: z.string().optional(),
    pictureUrl: z.string().url().nullish(),
    points: z.coerce.number().int().min(0).max(100).optional(),
    options: z.array(CreateOptionInputSchema).default([]),
  })
  .meta({ className: 'UpdateQuestionDto' });

export class UpdateQuestionDto extends createZodDto(UpdateQuestionSchema) {}

export const ReorderQuestionsSchema = z
  .object({
    questionIds: z.array(z.string().min(1)).min(1),
  })
  .meta({ className: 'ReorderQuestionsDto' });

export class ReorderQuestionsDto extends createZodDto(ReorderQuestionsSchema) {}
