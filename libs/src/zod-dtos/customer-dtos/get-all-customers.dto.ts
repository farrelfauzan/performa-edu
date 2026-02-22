import z from 'zod';
import { pageOptionsSchema } from '../../common';
import { createZodDto } from 'nestjs-zod/dto';

export const GetAllCustomersSchema = pageOptionsSchema.extend({
  search: z.string().optional(),
});

export class GetAllCustomerDto extends createZodDto(GetAllCustomersSchema) {}

export type GetAll = z.infer<typeof GetAllCustomersSchema>;
