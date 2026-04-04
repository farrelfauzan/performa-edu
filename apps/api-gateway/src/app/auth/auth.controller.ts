import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Put,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  AuthUser,
  CreateTeacherDto,
  CreateTeacherResponseDto,
  GrpcErrorHandler,
  handleGrpcCall,
  LoggedUserType,
  LoginDto,
  LoginResponseDto,
  ProfilePictureUploadUrlDto,
  PublicRoute,
  RegisterAdminDto,
  RegisterAdminResponseDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from '@performa-edu/libs';
import {
  TEACHER_SERVICE_NAME,
  TEACHERSERVICE_PACKAGE_NAME,
  TeacherServiceClient,
} from '@performa-edu/proto-types/teacher-service';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
  ProfileResponse,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
} from 'types/proto/auth-service';

@Controller({
  version: '1',
  path: 'auth',
})
export class AuthController implements OnModuleInit {
  private authService: AuthServiceClient;
  private teacherService: TeacherServiceClient;

  constructor(
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private authClient: ClientGrpc,
    @Inject(TEACHERSERVICE_PACKAGE_NAME)
    private teacherClient: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.authService =
      this.authClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
    this.teacherService =
      this.teacherClient.getService<TeacherServiceClient>(
        TEACHER_SERVICE_NAME
      );
  }

  @PublicRoute()
  @Post('login')
  async login(@Body() options: LoginDto): Promise<{
    data: LoginResponseDto;
  }> {
    try {
      const response = await handleGrpcCall(
        this.authService.login(options),
        this.grpcErrorHandler,
        'Authentication failed'
      );

      return { data: response };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // @Auth([{ action: AclAction.CREATE, subject: AclSubject.ADMIN }])
  @Post('register-admin')
  async registerAdmin(@Body() options: RegisterAdminDto): Promise<{
    data: RegisterAdminResponseDto;
  }> {
    const response = await handleGrpcCall(
      this.authService.registerAdmin(options),
      this.grpcErrorHandler,
      'Admin registration failed'
    );

    return {
      data: {
        admin: response.admin,
        user: response.user,
      },
    };
  }

  @Post('register-teacher')
  async registerTeacher(@Body() options: CreateTeacherDto): Promise<{
    data: CreateTeacherResponseDto;
  }> {
    let createdUserId: string | null = null;
    try {
      const { teacher, user } = options;

      const createUser = await handleGrpcCall(
        this.authService.createUser({
          username: user.username,
          email: user.email,
          password: user.password,
          roleIds: user.roleIds,
        }),
        this.grpcErrorHandler,
        'User creation failed'
      );

      createdUserId = createUser.id;

      const createTeacher = await handleGrpcCall(
        this.teacherService.createTeacher({
          ...teacher,
          userId: createUser.id,
          branchId: teacher.branchId || null,
          branchName: teacher.branchName || null,
        }),
        this.grpcErrorHandler,
        'Teacher creation failed'
      );

      return {
        data: {
          user: createUser,
          teacher: createTeacher.teacher,
        },
      };
    } catch (error) {
      if (createdUserId) {
        try {
          await handleGrpcCall(
            this.authService.deleteUserById({ id: createdUserId }),
            this.grpcErrorHandler,
            'Failed to rollback user creation'
          );
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }

      console.error('Register teacher error:', error);
      throw error;
    }
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

    return {
      data: response,
    };
  }

  @PublicRoute()
  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() options: RequestPasswordResetDto
  ): Promise<{ data: RequestPasswordResetResponse }> {
    const response = await handleGrpcCall(
      this.authService.requestPasswordReset(options),
      this.grpcErrorHandler,
      'Password reset request failed'
    );

    return { data: response };
  }

  @PublicRoute()
  @Post('reset-password')
  async resetPassword(
    @Body() options: ResetPasswordDto
  ): Promise<{ data: ResetPasswordResponse }> {
    const response = await handleGrpcCall(
      this.authService.resetPassword(options),
      this.grpcErrorHandler,
      'Password reset failed'
    );

    return { data: response };
  }

  @Auth()
  @Put('profile')
  async updateProfile(
    @AuthUser() user: LoggedUserType,
    @Body() body: UpdateProfileDto
  ): Promise<{ data: ProfileResponse }> {
    const response = await handleGrpcCall(
      this.authService.updateProfile({
        userId: user.userId,
        ...body,
      }),
      this.grpcErrorHandler,
      'Failed to update profile'
    );
    return { data: response };
  }

  @Auth()
  @Post('profile/upload-url')
  async getProfilePictureUploadUrl(
    @AuthUser() user: LoggedUserType,
    @Body() body: ProfilePictureUploadUrlDto
  ): Promise<{
    data: {
      uploadUrl: string;
      fields: Record<string, string>;
      s3Key: string;
      publicUrl: string;
      expiresIn: number;
    };
  }> {
    const response = await handleGrpcCall(
      this.authService.getProfilePictureUploadUrl({
        userId: user.userId,
        filename: body.filename,
        contentType: body.contentType,
      }),
      this.grpcErrorHandler,
      'Failed to generate upload URL'
    );
    return { data: response };
  }
}
