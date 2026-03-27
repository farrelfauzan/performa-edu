import { pageOptionsSchema } from '../../common';
import { createZodDto } from 'nestjs-zod/dto';
import z from 'zod';

export const GetAllQuizzesSchema = pageOptionsSchema.extend({
  search: z.string().optional(),
  isPublished: z
    .preprocess(
      (val) => (val === 'true' ? true : val === 'false' ? false : val),
      z.boolean().optional()
    )
    .optional(),
});

export class GetAllQuizzesDto extends createZodDto(GetAllQuizzesSchema) {}

export type GetAllQuizzes = z.infer<typeof GetAllQuizzesSchema>;
