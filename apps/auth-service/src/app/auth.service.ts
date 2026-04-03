import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from './repositories/auth.repository';
import {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserByIdRequest,
  DeleteUserByIdResponse,
  GetRolesRequest,
  GetRolesResponse,
  LoginRequest,
  LoginResponse,
  ProfilePictureUploadUrlRequest,
  ProfilePictureUploadUrlResponse,
  ProfileResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
  RequestPasswordResetRequest,
  RequestPasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UpdateProfileRequest,
} from 'types/proto/auth-service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Helper, TokenPayloadDto, UserType } from '@performa-edu/libs';
import { InvalidPasswordError, UserNotFoundError } from './errors/auth-errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly helper: Helper
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async login(options: LoginRequest): Promise<LoginResponse> {
    const user = await this.authRepository.findUserByEmailOrUsername(
      options.usernameOrEmail
    );

    const isPasswordValid = await this.helper.comparePassword(
      options.password,
      user.password
    );

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for user ID: ${user.id}`);
      InvalidPasswordError();
    }

    // Get user with roles
    const userWithRoles = await this.authRepository.findUserWithRoles(user.id);

    // if (!userWithRoles) {
    //   this.logger.error(`User roles not found for user ID: ${user.id}`);
    //   UserWithRolesNotFoundError(user.id);
    // }

    const token = new TokenPayloadDto({
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN'),
      accessToken: await this.jwtService.signAsync({
        userId: user.id,
        email: user.email,
        roles: userWithRoles.UserOnRole.map((ur) => ({
          name: ur.role.name,
          permissions: ur.role.permissions,
        })),
      }),
    });

    return {
      accessToken: token.accessToken,
      refreshToken: 'refresh-token-placeholder', // TODO: Implement refresh token
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: userWithRoles.UserOnRole.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          permissions: ur.role.permissions.map(
            (p: { action: string; subject: string; condition?: string }) => ({
              action: p.action,
              subject: p.subject,
              condition: p.condition || undefined,
            })
          ),
        })),
      },
    };
  }

  async registerAdmin(
    options: RegisterAdminRequest
  ): Promise<RegisterAdminResponse> {
    options.password = await this.helper.hashPassword(options.password);
    const result = await this.authRepository.registerAdmin(options);
    return {
      ...result,
      admin: {
        ...result.admin,
        createdAt: result.admin.createdAt,
        updatedAt: result.admin.updatedAt,
        deletedAt: result.admin.deletedAt || null,
      },
    };
  }

  async getMe(id: string): Promise<ProfileResponse> {
    const profile = await this.authRepository.getMe(id);
    return profile;
  }

  async getUserById(id: string): Promise<{
    data: UserType;
  }> {
    const user = await this.authRepository.findUserById(id);

    if (!user) {
      UserNotFoundError(id);
    }

    return { data: user };
  }

  async createUser(options: CreateUserRequest): Promise<CreateUserResponse> {
    options.password = await this.helper.hashPassword(options.password);
    const user = await this.authRepository.createUser(options);
    return user;
  }

  async deleteUserById(
    options: DeleteUserByIdRequest
  ): Promise<DeleteUserByIdResponse> {
    const result = await this.authRepository.deleteUserById(options);
    return result;
  }

  async requestPasswordReset(
    options: RequestPasswordResetRequest
  ): Promise<RequestPasswordResetResponse> {
    return await this.authRepository.createPasswordResetToken(options);
  }

  async resetPassword(
    options: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    const hashedPassword = await this.helper.hashPassword(options.newPassword);
    return await this.authRepository.resetPassword({
      ...options,
      newPassword: hashedPassword,
    });
  }

  async updateProfile(options: UpdateProfileRequest): Promise<ProfileResponse> {
    return this.authRepository.updateProfile(options);
  }

  async getProfilePictureUploadUrl(
    options: ProfilePictureUploadUrlRequest
  ): Promise<ProfilePictureUploadUrlResponse> {
    return this.authRepository.getProfilePictureUploadUrl(options);
  }

  async getRoles(options: GetRolesRequest): Promise<GetRolesResponse> {
    return this.authRepository.getRoles(options);
  }
}
