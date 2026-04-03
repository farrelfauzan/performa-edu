import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateCustomerSchema = z
  .object({
    user: z.object({
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
      roleIds: z.array(z.string()).min(1, 'At least one role is required'),
    }),
    customer: z.object({
      fullName: z.string().min(1, 'Full name is required'),
      phoneNumber: z.string().min(1, 'Phone number is required'),
      dateOfBirth: z.string().optional(),
      branchId: z.string().optional(),
      branchName: z.string().optional(),
    }),
  })
  .meta({ className: 'CreateCustomerDto' });

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}

export type CreateCustomerType = z.infer<typeof CreateCustomerSchema>;
