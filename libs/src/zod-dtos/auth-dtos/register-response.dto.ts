import { createZodDto } from 'nestjs-zod/dto';
import { z } from 'zod';

const userSchmea = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email(),
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      permissions: z.array(
        z.object({
          action: z.string(),
          subject: z.string(),
          condition: z.string().optional(),
        })
      ),
    })
  ),
});

const RegisterAdminResponseSchema = z.object({
  admin: z.object({
    id: z.string(),
    userId: z.string(),
    email: z.string(),
    active: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
  }),
  user: userSchmea,
});

const RegisterStudentSchema = z.object({
  student: z.object({
    id: z.string(),
    userId: z.string(),
    studentNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string(),
    address: z.string(),
    email: z.email(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
  }),
  user: userSchmea,
});

const RegisterTeacherSchema = z.object({
  teacher: z.object({
    id: z.string(),
    userId: z.string(),
    teacherNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phoneNumber: z.string(),
    address: z.string(),
    email: z.email(),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
  }),
  user: userSchmea,
});

export class RegisterAdminResponseDto extends createZodDto(
  RegisterAdminResponseSchema
) {}
export class RegisterStudentResponseDto extends createZodDto(
  RegisterStudentSchema
) {}
export class RegisterTeacherResponseDto extends createZodDto(
  RegisterTeacherSchema
) {}
