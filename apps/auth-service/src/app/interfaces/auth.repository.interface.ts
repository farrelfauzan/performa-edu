import { User, Role } from '@performa-edu/libs';
import {
  RegisterAdminDto,
  RegisterStudentDto,
  RegisterTeacherDto,
} from '../dtos/register.dto';
import {
  RegisterAdminResponseDto,
  RegisterStudentResponseDto,
  RegisterTeacherResponseDto,
} from '../dtos/register-response.dto';
import { ProfileResponseDto } from '../dtos/profile.dto';
import { UserType } from '../dtos/user.dto';

export interface UserWithRoles extends User {
  UserOnRole: Array<{
    role: Role;
  }>;
}

export interface IAuthRepository {
  // User operations
  findUserById(id: string): Promise<UserType | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserByEmailOrUsername(identifier: string): Promise<Partial<User> | null>;
  findUserWithRoles(id: string): Promise<UserWithRoles | null>;
  registerAdmin(data: RegisterAdminDto): Promise<RegisterAdminResponseDto>;
  registerStudent(
    data: RegisterStudentDto
  ): Promise<RegisterStudentResponseDto>;
  registerTeacher(
    data: RegisterTeacherDto
  ): Promise<RegisterTeacherResponseDto>;

  // Get Me
  getMe(id: string): Promise<ProfileResponseDto>;

  // Validation
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
  isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
}
