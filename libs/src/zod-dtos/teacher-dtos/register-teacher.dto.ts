import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterTeacherSchema = z
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
    branchId: z.string().min(1, 'Branch ID is required'),
    fullName: z.string().min(1, 'Full name is required'),
    phoneNumber: z.string().optional(),
    dateOfBirth: z.string().optional(),
    profilePictureUrl: z.string().url('Invalid URL').optional(),
    bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  })
  .meta({ id: 'RegisterTeacher' });

export class RegisterTeacherDto extends createZodDto(RegisterTeacherSchema) {}

export type RegisterTeacherType = z.infer<typeof RegisterTeacherSchema>;
