import { pageOptionsSchema } from '../../common';
import { createZodDto } from 'nestjs-zod/dto';
import z from 'zod';

export const GetAllContentSchema = pageOptionsSchema.extend({
  search: z.string().optional(),
});

export class GetAllContentDto extends createZodDto(GetAllContentSchema) {}

export type GetAllContent = z.infer<typeof GetAllContentSchema>;
