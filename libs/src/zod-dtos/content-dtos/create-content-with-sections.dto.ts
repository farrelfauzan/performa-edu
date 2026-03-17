import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { ContentStatusSchema } from './create-content.dto';

const CreateSectionVideoSchema = z.object({
  title: z.string().min(1, 'Video title is required'),
  sortOrder: z.coerce.number().int().min(0),
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.coerce.number().int().positive('File size must be positive'),
});

const CreateSectionSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
  videos: z
    .array(CreateSectionVideoSchema)
    .min(1, 'At least one video per section'),
});

const ThumbnailInputSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.coerce.number().int().positive('File size must be positive'),
});

const PreviewVideoInputSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.coerce.number().int().positive('File size must be positive'),
});

export const CreateContentWithSectionsSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    categoryId: z.string().min(1, 'Category is required'),
    year: z.coerce.number().int(),
    body: z.string().min(1, 'Body is required'),
    status: ContentStatusSchema,
    sections: z
      .array(CreateSectionSchema)
      .min(1, 'At least one section is required'),
    thumbnail: ThumbnailInputSchema.optional(),
    previewVideo: PreviewVideoInputSchema.optional(),
  })
  .meta({ className: 'CreateContentWithSectionsDto' });

export class CreateContentWithSectionsDto extends createZodDto(
  CreateContentWithSectionsSchema
) {}
