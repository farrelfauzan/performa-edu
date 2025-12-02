import { z } from 'zod';
import { Order } from '../../constant';
import { createZodDto } from 'nestjs-zod';

const pageOptionsSchema = z
  .object({
    order: z.enum(Order).optional().default(Order.ASC),
    page: z.number().int().min(0).optional().default(0),
    pageSize: z.number().int().min(1).max(100).optional().default(10),
    skip: z.number().int().min(0).optional().default(0),
    filter: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    sortBy: z.enum(['asc', 'desc']).optional(),
    query: z.string().optional(),
  })
  .meta({
    id: 'PageOptions',
  });

export class PageOptionsDto extends createZodDto(pageOptionsSchema) {}

export type PageOptions = z.infer<typeof pageOptionsSchema>;
