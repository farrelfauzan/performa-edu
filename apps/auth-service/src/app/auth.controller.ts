import { Controller, Logger } from '@nestjs/common';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  BasicUserResponse,
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserByIdRequest,
  DeleteUserByIdResponse,
  GetUserByIdRequest,
  LoginRequest,
  LoginResponse,
  ProfileRequest,
  ProfileResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
  RegisterCustomerRequest,
  RegisterCustomerResponse,
} from 'types/proto/auth-service';
import { AuthService } from './auth.service';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

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

  async registerAdmin(
    request: RegisterAdminRequest
  ): Promise<RegisterAdminResponse> {
    return await this.authService.registerAdmin(request);
  }

  async getMe(request: ProfileRequest): Promise<ProfileResponse> {
    // const profile = await this.authService.getMe(request.userId);
    // return {
    //   ...profile,
    //   createdAt: profile.createdAt.toISOString(),
    //   updatedAt: profile.updatedAt.toISOString(),
    //   deletedAt: profile.deletedAt ? profile.deletedAt.toISOString() : null,
    // };

    throw new Error('Method not implemented.');
  }

  async registerCustomer(
    request: RegisterCustomerRequest
  ): Promise<RegisterCustomerResponse> {
    throw new Error('Method not implemented.');
  }

  createUser(
    request: CreateUserRequest
  ):
    | Promise<CreateUserResponse>
    | Observable<CreateUserResponse>
    | CreateUserResponse {
    return this.authService.createUser(request);
  }

  async deleteUserById(
    request: DeleteUserByIdRequest
  ): Promise<DeleteUserByIdResponse> {
    return this.authService.deleteUserById(request);
  }
}
