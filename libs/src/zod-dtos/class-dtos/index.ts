import { createZodDto } from 'nestjs-zod/dto';
import z from 'zod';
import { pageOptionsSchema } from '../../common';

export const CreateClassSchema = z
  .object({
    name: z.string().min(1, 'Class name is required').max(255),
    description: z.string().max(1000).optional(),
  })
  .meta({ className: 'CreateClassDto' });

export class CreateClassDto extends createZodDto(CreateClassSchema) {}

export const UpdateClassSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    active: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .meta({ className: 'UpdateClassDto' });

export class UpdateClassDto extends createZodDto(UpdateClassSchema) {}

export const GetAllClassesSchema = pageOptionsSchema.extend({
  search: z.string().optional(),
  teacherId: z.string().optional(),
});

export class GetAllClassesDto extends createZodDto(GetAllClassesSchema) {}

export const AddTeachersToClassSchema = z
  .object({
    customerIds: z.array(z.string()).min(1, 'At least one teacher is required'),
  })
  .meta({ className: 'AddTeachersToClassDto' });

export class AddTeachersToClassDto extends createZodDto(
  AddTeachersToClassSchema
) {}

export const AddStudentsToClassSchema = z
  .object({
    studentIds: z.array(z.string()).min(1, 'At least one student is required'),
  })
  .meta({ className: 'AddStudentsToClassDto' });

export class AddStudentsToClassDto extends createZodDto(
  AddStudentsToClassSchema
) {}
