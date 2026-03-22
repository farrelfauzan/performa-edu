import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// ContentStatus enum values: DRAFT = 0, PUBLISHED = 1, ARCHIVED = 2, WAITING_REVIEW = 3
export const ContentStatusSchema = z.coerce.number().min(0).max(3).default(0);

export const CreateContentSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    year: z.coerce
      .number()
      .int()
      .min(1900, 'Year must be a valid integer')
      .max(new Date().getFullYear(), 'Year cannot be in the future'),
    categoryId: z.string().min(1, 'Category is required'),
    body: z.string().min(1, 'Body is required'),
    status: ContentStatusSchema,
  })
  .meta({ className: 'CreateContentDto' });

export class CreateContentDto extends createZodDto(CreateContentSchema) {}

export type CreateContentType = z.infer<typeof CreateContentSchema>;
