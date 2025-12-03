import { User, Role } from '@performa-edu/libs';
import {
  RegisterAdminDto,
  RegisterStudentDto,
  RegisterTeacherDto,
} from '../dto/register.dto';
import {
  RegisterAdminResponseDto,
  RegisterStudentResponseDto,
  RegisterTeacherResponseDto,
} from '../dto/register-response.dto';
import { ProfileResponseDto } from '../dto/profile.dto';

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  password?: string;
}

export interface UserWithRoles extends User {
  UserOnRole: Array<{
    role: Role;
  }>;
}

export interface IAuthRepository {
  // User operations
  findUserById(id: string): Promise<User | null>;
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
  updateUser(id: string, data: UpdateUserData): Promise<User>;
  softDeleteUser(id: string): Promise<User>;

  // Get Me
  getMe(id: string): Promise<ProfileResponseDto>;

  // Role operations
  findRoleById(id: string): Promise<Role | null>;
  findRoleByName(name: string): Promise<Role | null>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;

  // Validation
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
  isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
}
