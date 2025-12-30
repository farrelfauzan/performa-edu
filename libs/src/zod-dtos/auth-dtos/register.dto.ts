import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const RegisterSchema = z.object({
  email: z
    .email({
      message: 'Invalid email address',
    })
    .min(1, 'Email is required'),
  username: z.string().min(1, 'Username is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least 1 uppercase letter')
    .regex(/(?=.*[0-9])/, 'Password must contain at least 1 number')
    .regex(
      /(?=.*[!@#$%^&*])/,
      'Password must contain at least 1 special character'
    ),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

export const RegisterAdminSchema = RegisterSchema;

export class RegisterAdminDto extends createZodDto(RegisterAdminSchema) {}

export type RegisterAdminType = z.infer<typeof RegisterAdminSchema>;
