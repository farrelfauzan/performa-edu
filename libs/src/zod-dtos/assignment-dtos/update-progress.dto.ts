import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateProgressSchema = z
  .object({
    contentId: z.string().min(1, 'Content ID is required'),
    action: z.enum(['COMPLETE_SECTION', 'ANSWER_QUESTION']),
    sectionId: z.string().optional(),
    questionId: z.string().optional(),
  })
  .meta({ id: 'UpdateProgress' });

export class UpdateProgressDto extends createZodDto(UpdateProgressSchema) {}

export type UpdateProgressType = z.infer<typeof UpdateProgressSchema>;
