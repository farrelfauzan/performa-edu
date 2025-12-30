import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateCustomerSchema = z
  .object({
    email: z
      .email({
        error: 'Invalid email address',
      })
      .min(1, 'Email is required'),
    fullName: z.string().min(1, 'Full name is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    dateOfBirth: z.string().optional(),
  })
  .meta({ className: 'CreateCustomerDto' });

export class CreateCustomerDto extends createZodDto(CreateCustomerSchema) {}

export type CreateCustomerType = z.infer<typeof CreateCustomerSchema>;
