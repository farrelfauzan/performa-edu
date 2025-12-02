import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuthRepository } from './repositories/auth.repository';
import { LoginRequest, LoginResponse } from 'types/proto/auth-service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Helper } from '@performa-edu/libs';
import { TokenPayloadDto } from './dto/token';

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
}
