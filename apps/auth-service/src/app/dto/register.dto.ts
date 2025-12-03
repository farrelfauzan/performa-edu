import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const RegisterSchema = z.object({
  email: z
    .email({
      message: 'Invalid email address',
    })
    .min(1, 'Email is required'),
  username: z.string().min(1, 'Username is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least 1 uppercase letter')
    .regex(/(?=.*[0-9])/, 'Password must contain at least 1 number')
    .regex(
      /(?=.*[!@#$%^&*])/,
      'Password must contain at least 1 special character'
    ),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

export const RegisterAdminSchema = RegisterSchema;

export const RegisterStudentSchema = RegisterSchema.extend({
  studentNumber: z.string().min(1, 'Student number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export const RegisterTeacherSchema = RegisterSchema.extend({
  teacherNumber: z.string().min(1, 'Teacher number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export class RegisterAdminDto extends createZodDto(RegisterAdminSchema) {}
export class RegisterStudentDto extends createZodDto(RegisterStudentSchema) {}
export class RegisterTeacherDto extends createZodDto(RegisterTeacherSchema) {}

export type RegisterAdminType = z.infer<typeof RegisterAdminSchema>;
export type RegisterStudentType = z.infer<typeof RegisterStudentSchema>;
export type RegisterTeacherType = z.infer<typeof RegisterTeacherSchema>;
