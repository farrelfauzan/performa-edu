import { createZodDto } from 'nestjs-zod/dto';
import z from 'zod';

export const CreateCustomerResponseSchema = z
  .object({
    id: z.string(),
    uniqueId: z.string(),
    email: z.email({
      error: 'Invalid email address',
    }),
    fullName: z.string(),
    phoneNumber: z.string(),
    dateOfBirth: z.string().optional(),
    active: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().optional(),
  })
  .meta({ className: 'CreateCustomerResponseDto' });

export class CreateCustomerResponseDto extends createZodDto(
  CreateCustomerResponseSchema
) {}

export type CreateCustomerResponse = z.infer<
  typeof CreateCustomerResponseSchema
>;
