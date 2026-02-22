import { createZodDto } from 'nestjs-zod';
import z, { date } from 'zod';

const ProfileResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  uniqueId: z.string(),
  email: z.email(),
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      permissions: z.array(z.string()),
    })
  ),
  fullName: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  phoneNumber: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
  userId: z.string().nullable(),
});

export class ProfileResponseDto extends createZodDto(ProfileResponseSchema) {}

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
