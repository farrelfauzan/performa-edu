import { z } from 'zod';
import { userSchema } from '../auth-dtos';

const studentSchema = z
  .object({
    id: z.cuid().meta({ description: 'Unique identifier for the student' }),
    userId: z
      .cuid()
      .meta({ description: 'Identifier for the associated user' }),
    username: z.string().meta({ description: 'Username of the student' }),
    firstName: z.string().meta({ description: 'First name of the student' }),
    lastName: z.string().meta({ description: 'Last name of the student' }),
    studentNumber: z
      .string()
      .optional()
      .meta({ description: 'Student number assigned to the student' }),
    phoneNumber: z
      .string()
      .optional()
      .meta({ description: 'Phone number of the student' }),
    address: z
      .string()
      .optional()
      .meta({ description: 'Address of the student' }),
    createdAt: z.date().meta({ description: 'Creation timestamp' }),
    updatedAt: z.date().meta({ description: 'Last update timestamp' }),
    deletedAt: z.date().optional().meta({ description: 'Deletion timestamp' }),
    user: userSchema,
  })
  .meta({
    id: 'Student',
  });

export type StudentType = z.infer<typeof studentSchema>;
