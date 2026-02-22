import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateCustomerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    phoneNumber: z.string().min(1, 'Phone number is required').optional(),
    dateOfBirth: z.string().optional(),
  })
  .meta({ className: 'UpdateCustomerDto' });

export class UpdateCustomerDto extends createZodDto(UpdateCustomerSchema) {}

export type UpdateCustomerType = z.infer<typeof UpdateCustomerSchema>;
