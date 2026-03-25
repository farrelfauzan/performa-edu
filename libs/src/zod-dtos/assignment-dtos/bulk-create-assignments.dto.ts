import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const BulkCreateAssignmentsSchema = z
  .object({
    studentIds: z
      .array(z.string().min(1))
      .min(1, 'At least one student ID is required'),
    contentId: z.string().min(1, 'Content ID is required'),
    dueDate: z.string().optional(),
  })
  .meta({ id: 'BulkCreateAssignments' });

export class BulkCreateAssignmentsDto extends createZodDto(
  BulkCreateAssignmentsSchema
) {}

export type BulkCreateAssignmentsType = z.infer<
  typeof BulkCreateAssignmentsSchema
>;
