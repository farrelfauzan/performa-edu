import { z } from 'zod';
import { Order } from '../../constant';
import { createZodDto } from 'nestjs-zod';

export const pageOptionsSchema = z
  .object({
    order: z.enum(Order).optional(),
    page: z.number().int().min(0).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    skip: z.number().int().min(0).optional(),
    sortBy: z.string().optional(),
    query: z.string().optional(),
  })
  .meta({
    id: 'PageOptions',
  });

export class PageOptionsDto extends createZodDto(pageOptionsSchema) {}

export type PageOptions = z.infer<typeof pageOptionsSchema>;
