import z from 'zod';
import { pageOptionsSchema } from '../../common';
import { createZodDto } from 'nestjs-zod/dto';

export const GetAllTeachersSchema = pageOptionsSchema.extend({
  search: z.string().optional(),
});

export class GetAllTeacherDto extends createZodDto(GetAllTeachersSchema) {}

export type GetAll = z.infer<typeof GetAllTeachersSchema>;
