import { createZodDto } from 'nestjs-zod/dto';
import z from 'zod';

export const CreateCustomerResponseSchema = z
  .object({
    user: z.object({
      email: z
        .email({ error: 'Invalid email address' })
        .min(1, 'Email is required'),
      username: z.string().min(1, 'Username is required'),
      roles: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          permissions: z.array(
            z.object({
              action: z.string(),
              subject: z.string(),
              condition: z.string().optional(),
            })
          ),
        })
      ),
      createdAt: z.string(),
      updatedAt: z.string(),
      deletedAt: z.string().optional(),
    }),
    customer: z.object({
      id: z.string(),
      userId: z.string().min(1, 'User ID is required'),
      uniqueId: z.string().min(1, 'Unique ID is required'),
      fullName: z.string().min(1, 'Full name is required'),
      phoneNumber: z.string().min(1, 'Phone number is required'),
      dateOfBirth: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      deletedAt: z.string().optional(),
    }),
  })
  .meta({ className: 'CreateCustomerResponseDto' });

export class CreateCustomerResponseDto extends createZodDto(
  CreateCustomerResponseSchema
) {}

export type CreateCustomerResponse = z.infer<
  typeof CreateCustomerResponseSchema
>;
