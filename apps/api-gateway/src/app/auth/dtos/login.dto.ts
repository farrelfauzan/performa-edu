import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string().min(6),
});

export class LoginDto extends createZodDto(LoginSchema) {}

export type LoginType = z.infer<typeof LoginSchema>;
