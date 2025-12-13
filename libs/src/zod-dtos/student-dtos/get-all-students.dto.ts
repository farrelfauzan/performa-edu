import { pageOptionsSchema } from 'libs/src/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const GetAllStudentsSchema = pageOptionsSchema
  .extend({
    search: z.string().optional(),
  })
  .meta({
    id: 'GetAllStudents',
  });

export class GetAllStudentsDto extends createZodDto(GetAllStudentsSchema) {}

export type GetAllStudents = z.infer<typeof GetAllStudentsSchema>;
