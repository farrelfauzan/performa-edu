import { User, Role, UserType } from '@performa-edu/libs';
import {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserByIdRequest,
  DeleteUserByIdResponse,
  ProfileResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
} from '@performa-edu/proto-types/auth-service';

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
  registerAdmin(data: RegisterAdminRequest): Promise<RegisterAdminResponse>;
  createUser(options: CreateUserRequest): Promise<CreateUserResponse>;
  deleteUserById(
    options: DeleteUserByIdRequest
  ): Promise<DeleteUserByIdResponse>;

  // Get Me
  getMe(id: string): Promise<ProfileResponse>;

  // Validation
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
  isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
}
