import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientGrpc, GrpcMethod } from '@nestjs/microservices';
import {
  Auth,
  CreateTeacherDto,
  GetAllTeacherDto,
  GrpcErrorHandler,
  handleGrpcCall,
  StorageClient,
  UpdateTeacherDto,
} from '@performa-edu/libs';
import { ConfigService } from '@nestjs/config';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
} from '@performa-edu/proto-types/auth-service';
import {
  TEACHER_SERVICE_NAME,
  TEACHERSERVICE_PACKAGE_NAME,
  TeacherServiceClient,
  DeleteTeacherResponse,
  GetAllTeachersResponse,
  GetTeacherByIdResponse,
  UpdateTeacherResponse,
  ProfilePictureUploadUrlRequest,
} from '@performa-edu/proto-types/teacher-service';
import { AclAction, AclSubject } from 'libs/src/constant';
import { RegisterTeacherDto } from 'libs/src/zod-dtos/teacher-dtos/register-teacher.dto';

@Controller({
  version: '1',
  path: 'teachers',
})
export class TeacherController implements OnModuleInit {
  private teacherService: TeacherServiceClient;
  private authService: AuthServiceClient;
  private storageClient: StorageClient;
  private readonly logger = new Logger(TeacherController.name);

  constructor(
    @Inject(TEACHERSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private authClient: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler,
    private readonly configService: ConfigService
  ) {
    this.storageClient = new StorageClient(this.configService);
  }

  onModuleInit() {
    this.teacherService =
      this.client.getService<TeacherServiceClient>(TEACHER_SERVICE_NAME);
    this.authService =
      this.authClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  @Auth([
    {
      action: AclAction.READ,
      subject: AclSubject.TEACHER,
    },
  ])
  @Get()
  async getTeachers(@Query() options: GetAllTeacherDto): Promise<{
    data: GetAllTeachersResponse['teachers'];
    meta: GetAllTeachersResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.teacherService.getAllTeachers(options),
      this.grpcErrorHandler,
      'Failed to fetch teachers'
    );

    return {
      data: result.teachers,
      meta: result.meta,
    };
  }

  @Auth([
    {
      action: AclAction.CREATE,
      subject: AclSubject.TEACHER,
    },
  ])
  @Post()
  async createTeacher(@Body() options: RegisterTeacherDto) {
    let createdUserId: string | null = null;
    try {
      const { roles } = await handleGrpcCall(
        this.authService.getRoles({ name: 'TEACHER' }),
        this.grpcErrorHandler,
        'Failed to fetch roles'
      );

      const createUser = await handleGrpcCall(
        this.authService.createUser({
          username: options.username,
          email: options.email,
          password: options.password,
          roleIds: roles.map((role) => role.id),
        }),
        this.grpcErrorHandler,
        'User creation failed'
      );

      createdUserId = createUser.id;

      const result = await handleGrpcCall(
        this.teacherService.createTeacher({
          userId: createUser.id,
          fullName: options.fullName,
          phoneNumber: options.phoneNumber,
          dateOfBirth: options.dateOfBirth,
          profilePictureUrl: options.profilePictureUrl,
          branchId: options.branchId,
        }),
        this.grpcErrorHandler,
        'Teacher registration failed'
      );

      return {
        data: {
          user: createUser,
          teacher: result.teacher,
        },
      };
    } catch (error) {
      // Rollback: delete uploaded profile picture from S3
      if (options.profilePictureUrl) {
        try {
          await this.storageClient.deleteFile(options.profilePictureUrl);
        } catch (s3Error) {
          this.logger.error('Failed to rollback S3 profile picture:', s3Error);
        }
      }
      // Rollback: delete created user
      if (createdUserId) {
        try {
          await handleGrpcCall(
            this.authService.deleteUserById({ id: createdUserId }),
            this.grpcErrorHandler,
            'Failed to rollback user creation'
          );
        } catch (rollbackError) {
          this.logger.error('Rollback failed:', rollbackError);
        }
      }
      throw error;
    }
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.TEACHER }])
  @Post('profile/upload-url')
  async getProfilePictureUploadUrl(
    @Body() options: ProfilePictureUploadUrlRequest
  ) {
    const result = await handleGrpcCall(
      this.teacherService.getProfilePictureUploadUrl(options),
      this.grpcErrorHandler,
      'Failed to get profile picture upload URL'
    );

    return {
      data: result,
    };
  }

  @Auth([
    {
      action: AclAction.READ,
      subject: AclSubject.TEACHER,
    },
  ])
  @Get(':id')
  async getTeacherById(@Param('id') id: string): Promise<{
    data: GetTeacherByIdResponse['teacher'];
  }> {
    const result = await handleGrpcCall(
      this.teacherService.getTeacherById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch teacher by ID'
    );

    return {
      data: result.teacher,
    };
  }

  @Auth([
    {
      action: AclAction.UPDATE,
      subject: AclSubject.TEACHER,
    },
  ])
  @Put(':id')
  async updateTeacher(
    @Param('id') id: string,
    @Body() options: UpdateTeacherDto
  ): Promise<{
    data: UpdateTeacherResponse['teacher'];
  }> {
    const result = await handleGrpcCall(
      this.teacherService.updateTeacher({
        id,
        ...options,
      }),
      this.grpcErrorHandler,
      'Failed to update teacher'
    );

    return {
      data: result.teacher,
    };
  }

  @Auth([
    {
      action: AclAction.DELETE,
      subject: AclSubject.TEACHER,
    },
  ])
  @Delete(':id')
  async deleteTeacher(@Param('id') id: string): Promise<{
    data: DeleteTeacherResponse;
  }> {
    const result = await handleGrpcCall(
      this.teacherService.deleteTeacher({ id }),
      this.grpcErrorHandler,
      'Failed to delete teacher'
    );

    return { data: result };
  }
}
