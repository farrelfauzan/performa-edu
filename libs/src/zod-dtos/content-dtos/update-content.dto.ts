import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { ContentStatusSchema } from './create-content.dto';

export const UpdateContentSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    body: z.string().min(1, 'Body is required').optional(),
    status: ContentStatusSchema.optional(),
  })
  .meta({ className: 'UpdateContentDto' });

export class UpdateContentDto extends createZodDto(UpdateContentSchema) {}

export type UpdateContentType = z.infer<typeof UpdateContentSchema>;
