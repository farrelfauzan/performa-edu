import { Controller, Logger } from '@nestjs/common';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  BasicUserResponse,
  GetUserByIdRequest,
  LoginRequest,
  LoginResponse,
  ProfileRequest,
  ProfileResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
  RegisterStudentRequest,
  RegisterStudentResponse,
  RegisterTeacherRequest,
  RegisterTeacherResponse,
} from 'types/proto/auth-service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { GrpcMethod } from '@nestjs/microservices';
import { User } from '@prisma/client';

@Controller('auth')
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    return await this.authService.login(request);
  }

  @GrpcMethod('AuthService', 'GetUserById')
  async getUserById(request: GetUserByIdRequest): Promise<BasicUserResponse> {
    const result = await this.authService.getUserById(request.id);
    return {
      id: result.data.id,
      username: result.data.username,
      email: result.data.email,
    };
  }

  registerAdmin(
    request: RegisterAdminRequest
  ):
    | Promise<RegisterAdminResponse>
    | Observable<RegisterAdminResponse>
    | RegisterAdminResponse {
    return this.authService.registerAdmin(request);
  }

  registerStudent(
    request: RegisterStudentRequest
  ):
    | Promise<RegisterStudentResponse>
    | Observable<RegisterStudentResponse>
    | RegisterStudentResponse {
    return this.authService.registerStudent(request);
  }

  registerTeacher(
    request: RegisterTeacherRequest
  ):
    | Promise<RegisterTeacherResponse>
    | Observable<RegisterTeacherResponse>
    | RegisterTeacherResponse {
    return this.authService.registerTeacher(request);
  }

  async getMe(request: ProfileRequest): Promise<ProfileResponse> {
    const profile = await this.authService.getMe(request.userId);
    return {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      deletedAt: profile.deletedAt ? profile.deletedAt.toISOString() : null,
    };
  }
}
