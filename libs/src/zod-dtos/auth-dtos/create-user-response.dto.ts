import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const CreateUserResponseSchema = z
  .object({
    id: z.string(),
    email: z.email({
      error: 'Invalid email address',
    }),
    username: z.string(),
    active: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().optional(),
  })
  .meta({ className: 'CreateUserResponseDto' });

export class CreateUserResponseDto extends createZodDto(
  CreateUserResponseSchema
) {}

export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
