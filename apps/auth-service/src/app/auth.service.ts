import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuthRepository } from './repositories/auth.repository';
import {
  LoginRequest,
  LoginResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
  RegisterStudentRequest,
  RegisterStudentResponse,
  RegisterTeacherRequest,
  RegisterTeacherResponse,
} from 'types/proto/auth-service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Helper, User } from '@performa-edu/libs';
import { TokenPayloadDto } from './dtos/token.dto';
import { ProfileResponseDto } from './dtos/profile.dto';
import { UserType } from './dtos/user.dto';

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
    try {
      const user = await this.authRepository.findUserByEmailOrUsername(
        options.usernameOrEmail
      );

      if (!user) {
        this.logger.error(`Login failed: User not found`);
        throw new RpcException({
          code: 5, // NOT_FOUND
          message:
            'Invalid username or password. Please check your credentials and try again.',
        });
      }

      const isPasswordValid = await this.helper.comparePassword(
        options.password,
        user.password
      );

      if (!isPasswordValid) {
        this.logger.error(`Login failed: Invalid password`);
        throw new RpcException({
          code: 16, // UNAUTHENTICATED
          message:
            'Invalid username or password. Please check your credentials and try again.',
        });
      }

      // Get user with roles
      const userWithRoles = await this.authRepository.findUserWithRoles(
        user.id
      );

      if (!userWithRoles) {
        throw new RpcException({
          code: 13, // INTERNAL
          message: 'User data not found',
        });
      }

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
            permissions: ur.role.permissions.map((p) => String(p)),
          })),
        },
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }

      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'Authentication failed',
      });
    }
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
        createdAt: result.admin.createdAt.toISOString(),
        updatedAt: result.admin.updatedAt.toISOString(),
        deletedAt: result.admin.deletedAt
          ? result.admin.deletedAt.toISOString()
          : null,
      },
    };
  }

  async registerStudent(
    options: RegisterStudentRequest
  ): Promise<RegisterStudentResponse> {
    options.password = await this.helper.hashPassword(options.password);
    const result = await this.authRepository.registerStudent(options);
    return {
      ...result,
      student: {
        ...result.student,
        createdAt: result.student.createdAt.toISOString(),
        updatedAt: result.student.updatedAt.toISOString(),
        deletedAt: result.student.deletedAt
          ? result.student.deletedAt.toISOString()
          : null,
      },
    };
  }

  async registerTeacher(
    options: RegisterTeacherRequest
  ): Promise<RegisterTeacherResponse> {
    options.password = await this.helper.hashPassword(options.password);
    const result = await this.authRepository.registerTeacher(options);
    return {
      ...result,
      teacher: {
        ...result.teacher,
        createdAt: result.teacher.createdAt.toISOString(),
        updatedAt: result.teacher.updatedAt.toISOString(),
        deletedAt: result.teacher.deletedAt
          ? result.teacher.deletedAt.toISOString()
          : null,
      },
    };
  }

  async getMe(id: string): Promise<ProfileResponseDto> {
    const profile = await this.authRepository.getMe(id);
    return profile;
  }

  async getUserById(id: string): Promise<{
    data: UserType;
  }> {
    const user = await this.authRepository.findUserById(id);
    return { data: user };
  }
}
