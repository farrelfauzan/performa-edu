import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const StartContentConversionSchema = z
  .object({
    callbackUrl: z.string().url().optional(),
  })
  .meta({ className: 'StartContentConversionDto' });

export class StartContentConversionDto extends createZodDto(
  StartContentConversionSchema
) {}
