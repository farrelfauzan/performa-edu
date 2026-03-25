import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateStudentSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    phoneNumber: z.string().optional().nullable(),
    dateOfBirth: z.string().optional(),
    bio: z.string().optional().nullable(),
  })
  .meta({
    id: 'UpdateStudent',
  });

export class UpdateStudentDto extends createZodDto(updateStudentSchema) {}

export type UpdateStudent = z.infer<typeof updateStudentSchema>;
