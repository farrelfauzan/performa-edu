import { createZodDto } from 'nestjs-zod/dto';
import z from 'zod';
import { pageOptionsSchema } from '../../common';

export const CreateBranchSchema = z
  .object({
    name: z.string().min(1, 'Branch name is required').max(255),
    address: z.string().max(1000).optional(),
    phone: z.string().max(15).optional(),
  })
  .meta({ className: 'CreateBranchDto' });

export class CreateBranchDto extends createZodDto(CreateBranchSchema) {}

export const UpdateBranchSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    address: z.string().max(1000).optional(),
    phone: z.string().max(15).optional(),
    adminId: z.string().optional(),
    adminName: z.string().max(255).optional(),
  })
  .meta({ className: 'UpdateBranchDto' });

export class UpdateBranchDto extends createZodDto(UpdateBranchSchema) {}

export const GetAllBranchesSchema = pageOptionsSchema.extend({
  search: z.string().optional(),
});

export class GetAllBranchesDto extends createZodDto(GetAllBranchesSchema) {}

export const AssignCustomersToBranchSchema = z
  .object({
    customerIds: z
      .array(z.string())
      .min(1, 'At least one customer is required'),
  })
  .meta({ className: 'AssignCustomersToBranchDto' });

export class AssignCustomersToBranchDto extends createZodDto(
  AssignCustomersToBranchSchema
) {}

export const AssignStudentsToBranchSchema = z
  .object({
    studentIds: z.array(z.string()).min(1, 'At least one student is required'),
  })
  .meta({ className: 'AssignStudentsToBranchDto' });

export class AssignStudentsToBranchDto extends createZodDto(
  AssignStudentsToBranchSchema
) {}
