import {
  User,
  Role,
  UserType,
  RegisterAdminDto,
  RegisterAdminResponseDto,
  RegisterStudentDto,
  RegisterStudentResponseDto,
  RegisterTeacherDto,
  RegisterTeacherResponseDto,
  ProfileResponseDto,
} from '@performa-edu/libs';

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
