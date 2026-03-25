import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterStudentSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain a special character'
      ),
    // roleIds: z.array(z.string()).min(1, 'At least one role ID is required'), --- IGNORE ---
    fullName: z.string().min(1, 'Full name is required'),
    phoneNumber: z.string().optional(),
    dateOfBirth: z.string().optional(),
    profilePictureUrl: z.string().url('Invalid URL').optional(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  })
  .meta({ id: 'RegisterStudent' });

export class RegisterStudentDto extends createZodDto(RegisterStudentSchema) {}

export type RegisterStudentType = z.infer<typeof RegisterStudentSchema>;
