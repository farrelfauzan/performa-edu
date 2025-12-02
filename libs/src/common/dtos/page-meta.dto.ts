import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const pageMetaSchema = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    count: z.number().int().min(0),
    pageCount: z.number().int().min(0).optional(),
    hasPreviousPage: z.boolean().optional(),
    hasNextPage: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Calculate pageCount if not provided
      const calculatedPageCount = Math.ceil(data.count / data.pageSize);

      // If pageCount is provided, validate it matches calculation
      if (
        data.pageCount !== undefined &&
        data.pageCount !== calculatedPageCount
      ) {
        return false;
      }

      // Validate page is within bounds
      if (data.page > calculatedPageCount && calculatedPageCount > 0) {
        return false;
      }

      // Validate hasPreviousPage logic
      if (
        data.hasPreviousPage !== undefined &&
        data.hasPreviousPage !== data.page > 1
      ) {
        return false;
      }

      // Validate hasNextPage logic
      if (
        data.hasNextPage !== undefined &&
        data.hasNextPage !== data.page < calculatedPageCount
      ) {
        return false;
      }

      return true;
    },
    {
      message:
        'Page metadata validation failed: inconsistent pagination values',
    }
  )
  .meta({
    id: 'PageMeta',
  });

export class PageMetaDto extends createZodDto(pageMetaSchema) {}

export type PageMeta = z.infer<typeof pageMetaSchema>;
