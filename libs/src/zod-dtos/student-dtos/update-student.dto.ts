import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateStudentSchema = z
  .object({
    id: z.cuid(),
    email: z.email().optional(),
    username: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    address: z.string().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
  })
  .meta({
    id: 'UpdateStudent',
  });

export class UpdateStudentDto extends createZodDto(updateStudentSchema) {}

export type UpdateStudent = z.infer<typeof updateStudentSchema>;
