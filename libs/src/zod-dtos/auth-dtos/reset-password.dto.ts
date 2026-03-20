import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const RequestPasswordResetSchema = z.object({
  email: z
    .email({
      message: 'Invalid email address',
    })
    .min(1, 'Email is required'),
});

export class RequestPasswordResetDto extends createZodDto(
  RequestPasswordResetSchema
) {}

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least 1 uppercase letter')
    .regex(/(?=.*[0-9])/, 'Password must contain at least 1 number')
    .regex(
      /(?=.*[!@#$%^&*])/,
      'Password must contain at least 1 special character'
    ),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
