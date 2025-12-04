import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Req,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  AuthUser,
  GrpcErrorHandler,
  handleGrpcCall,
  PublicRoute,
} from '@performa-edu/libs';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
  ProfileResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
  RegisterStudentRequest,
  RegisterStudentResponse,
} from 'types/proto/auth-service';
import { LoginDto } from './dtos/login.dto';
import { LoginResponseDto } from './dtos/login-response.dto';
import { AclAction, AclSubject } from 'libs/src/constant';
import { LoggedUserDto, LoggedUserType } from './dtos/logged-user.dto';

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

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.ADMIN }])
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

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.ADMIN }])
  @Post('register-student')
  async registerStudent(@Body() options: RegisterStudentRequest): Promise<{
    data: RegisterStudentResponse;
  }> {
    const response = await handleGrpcCall(
      this.authService.registerStudent(options),
      this.grpcErrorHandler,
      'Student registration failed'
    );
    return { data: response };
  }

  @Auth()
  @Get('getMe')
  async getProfile(@AuthUser() user: LoggedUserType): Promise<{
    data: ProfileResponse;
  }> {
    const userId = user.userId;
    const response = await handleGrpcCall(
      this.authService.getMe({ userId }),
      this.grpcErrorHandler,
      'Fetching profile failed'
    );
    return { data: response };
  }
}
