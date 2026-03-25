import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  GrpcErrorHandler,
  handleGrpcCall,
  ProfilePictureUploadUrlDto,
  RegisterStudentDto,
  GetAllStudentsDto,
  UpdateStudentDto,
} from '@performa-edu/libs';
import {
  STUDENT_SERVICE_NAME,
  STUDENTSERVICE_PACKAGE_NAME,
  StudentServiceClient,
} from '@performa-edu/proto-types/student-service';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
} from '@performa-edu/proto-types/auth-service';
import { AclAction, AclSubject } from 'libs/src/constant';

@Controller({
  version: '1',
  path: 'students',
})
export class StudentController implements OnModuleInit {
  private studentService: StudentServiceClient;
  private authService: AuthServiceClient;

  constructor(
    @Inject(STUDENTSERVICE_PACKAGE_NAME)
    private studentClient: ClientGrpc,
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private authClient: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.studentService =
      this.studentClient.getService<StudentServiceClient>(STUDENT_SERVICE_NAME);
    this.authService =
      this.authClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.STUDENT }])
  @Post()
  async registerStudent(@Body() body: RegisterStudentDto) {
    let createdUserId: string | null = null;
    try {
      // Get Student Role ID from auth-service
      const { roles } = await handleGrpcCall(
        this.authService.getRoles({ name: 'STUDENT' }),
        this.grpcErrorHandler,
        'Failed to fetch roles'
      );

      // Step 1: Create user in auth-service with STUDENT role
      const createUser = await handleGrpcCall(
        this.authService.createUser({
          username: body.username,
          email: body.email,
          password: body.password,
          roleIds: roles.map((role) => role.id),
        }),
        this.grpcErrorHandler,
        'User creation failed'
      );

      createdUserId = createUser.id;

      // Step 2: Create student profile in student-service
      const result = await handleGrpcCall(
        this.studentService.registerStudent({
          userId: createUser.id,
          fullName: body.fullName,
          phoneNumber: body.phoneNumber,
          dateOfBirth: body.dateOfBirth,
          profilePictureUrl: body.profilePictureUrl,
          bio: body.bio,
        }),
        this.grpcErrorHandler,
        'Student registration failed'
      );

      return {
        data: {
          user: createUser,
          student: result.student,
        },
      };
    } catch (error) {
      // Rollback: delete user if student creation failed
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
      throw error;
    }
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.STUDENT }])
  @Get()
  async getAllStudents(@Query() options: GetAllStudentsDto) {
    const result = await handleGrpcCall(
      this.studentService.getAllStudents(options),
      this.grpcErrorHandler,
      'Failed to fetch students'
    );

    return { data: result.students, meta: result.meta };
  }

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.STUDENT }])
  @Post('profile/upload-url')
  async getProfileUploadUrl(@Body() body: ProfilePictureUploadUrlDto) {
    const response = await handleGrpcCall(
      this.studentService.getProfilePictureUploadUrl({
        filename: body.filename,
        contentType: body.contentType,
      }),
      this.grpcErrorHandler,
      'Failed to generate upload URL'
    );
    return { data: response };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.STUDENT }])
  @Get(':id')
  async getStudentById(@Param('id') id: string) {
    const result = await handleGrpcCall(
      this.studentService.getStudentById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch student'
    );

    return { data: result.student };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.STUDENT }])
  @Put(':id')
  async updateStudent(@Param('id') id: string, @Body() body: UpdateStudentDto) {
    const result = await handleGrpcCall(
      this.studentService.updateStudent({ id, ...body }),
      this.grpcErrorHandler,
      'Failed to update student'
    );

    return { data: result.student };
  }

  @Auth([{ action: AclAction.DELETE, subject: AclSubject.STUDENT }])
  @Delete(':id')
  async deleteStudent(@Param('id') id: string) {
    const result = await handleGrpcCall(
      this.studentService.deleteStudent({ id }),
      this.grpcErrorHandler,
      'Failed to delete student'
    );

    return { data: result };
  }
}
