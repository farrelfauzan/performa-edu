import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
});

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema.optional(),
});

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
