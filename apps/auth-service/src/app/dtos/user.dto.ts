import { z } from 'zod';

export const userSchema = z.object({
  id: z.cuid(),
  email: z.email(),
  username: z.string(),
});

export type UserType = z.infer<typeof userSchema>;
