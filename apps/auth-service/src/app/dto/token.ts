import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TokenPayloadSchema = z.object({
  expiresIn: z.number(),
  accessToken: z.string(),
});

export class TokenPayloadDto extends createZodDto(TokenPayloadSchema) {
  constructor(partial: Partial<TokenPayloadDto>) {
    super();
    Object.assign(this, partial);
  }
}

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
