import { Controller, Logger } from '@nestjs/common';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  LoginRequest,
  LoginResponse,
  RegisterAdminRequest,
  RegisterAdminResponse,
  RegisterStudentRequest,
  RegisterStudentResponse,
  RegisterTeacherRequest,
  RegisterTeacherResponse,
} from 'types/proto/auth-service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Controller('auth')
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    return await this.authService.login(request);
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
}
