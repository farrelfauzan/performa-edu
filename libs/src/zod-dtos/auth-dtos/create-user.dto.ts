import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateUserSchema = z
  .object({
    email: z
      .email({ error: 'Invalid email address' })
      .min(1, 'Email is required'),
    username: z.string().min(1, 'Username is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one capital letter')
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        'Password must contain at least one special character'
      ),
  })
  .meta({ className: 'CreateUserDto' });

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export type CreateUserType = z.infer<typeof CreateUserSchema>;
