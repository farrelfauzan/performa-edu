import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateAssignmentSchema = z
  .object({
    studentId: z.string().min(1, 'Student ID is required'),
    contentId: z.string().min(1, 'Content ID is required'),
    dueDate: z.string().optional(),
  })
  .meta({ id: 'CreateAssignment' });

export class CreateAssignmentDto extends createZodDto(CreateAssignmentSchema) {}

export type CreateAssignmentType = z.infer<typeof CreateAssignmentSchema>;
