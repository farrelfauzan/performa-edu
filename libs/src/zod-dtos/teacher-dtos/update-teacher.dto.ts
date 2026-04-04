import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateTeacherSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    phoneNumber: z.string().min(1, 'Phone number is required').optional(),
    dateOfBirth: z.string().optional(),
  })
  .meta({ className: 'UpdateTeacherDto' });

export class UpdateTeacherDto extends createZodDto(UpdateTeacherSchema) {}

export type UpdateTeacherType = z.infer<typeof UpdateTeacherSchema>;
