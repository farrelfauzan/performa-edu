import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const ConversionWebhookSchema = z
  .object({
    job_id: z.string().min(1),
    status: z.enum(['completed', 'failed']),
    master_playlist_url: z.string().nullable().optional(),
    error_message: z.string().nullable().optional(),
  })
  .meta({ className: 'ConversionWebhookDto' });

export class ConversionWebhookDto extends createZodDto(
  ConversionWebhookSchema
) {}
