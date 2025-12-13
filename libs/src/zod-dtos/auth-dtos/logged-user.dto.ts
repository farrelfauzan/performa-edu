import { createZodDto } from 'nestjs-zod/dto';
import z from 'zod';

const LoggedUserSchema = z.object({
  userId: z.string().nullable(),
  email: z.email().nullable(),
  roles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        permissions: z.array(z.string()),
      })
    )
    .nullable(),
});

export class LoggedUserDto extends createZodDto(LoggedUserSchema) {}

export type LoggedUserType = z.infer<typeof LoggedUserSchema>;
