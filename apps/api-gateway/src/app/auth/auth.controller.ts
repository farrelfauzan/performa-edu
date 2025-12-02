import { Body, Controller, Inject, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { PublicRoute } from '@performa-edu/libs';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
  LoginResponse,
} from 'types/proto/auth-service';
import { LoginDto } from './dtos/login.dto';
import { GrpcErrorHandler } from '../common/grpc-error.handler';
import { handleGrpcCall } from '../common/grpc-error.operator';

@Controller('auth')
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
  async login(@Body() options: LoginDto): Promise<LoginResponse> {
    return handleGrpcCall(
      this.authService.login(options),
      this.grpcErrorHandler,
      'Authentication failed'
    );
  }
}
