import { Body, Controller, Inject, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { PublicRoute } from '@performa-edu/libs';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
  LoginResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
} from 'types/proto/auth-service';
import { LoginDto } from './dtos/login.dto';
import { GrpcErrorHandler } from '../common/grpc-error.handler';
import { handleGrpcCall } from '../common/grpc-error.operator';
import { LoginResponseDto } from './dtos/login-response.dto';

@Controller({
  version: '1',
  path: 'auth',
})
export class AuthController implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  @PublicRoute()
  @Post('login')
  async login(@Body() options: LoginDto): Promise<{
    data: LoginResponseDto;
  }> {
    const response = await handleGrpcCall(
      this.authService.login(options),
      this.grpcErrorHandler,
      'Authentication failed'
    );
    return {
      data: response,
    };
  }

  @PublicRoute()
  @Post('register-admin')
  async registerAdmin(@Body() options: RegisterAdminRequest): Promise<{
    data: RegisterAdminResponse;
  }> {
    const response = await handleGrpcCall(
      this.authService.registerAdmin(options),
      this.grpcErrorHandler,
      'Admin registration failed'
    );
    return { data: response };
  }
}
