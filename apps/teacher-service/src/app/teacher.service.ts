import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TeacherRepository } from './repositories/teacher.repository';
import {
  CreateTeacherRequest,
  CreateTeacherResponse,
  DeleteTeacherRequest,
  DeleteTeacherResponse,
  GetAllTeachersRequest,
  GetAllTeachersResponse,
  GetTeacherByIdResponse,
  UpdateTeacherRequest,
  UpdateTeacherResponse,
  ProfilePictureUploadUrlRequest,
  ProfilePictureUploadUrlResponse,
} from '@performa-edu/proto-types/teacher-service';
import {
  Teacher,
  GrpcErrorHandler,
  handleGrpcCall,
  transformResponse,
} from '@performa-edu/libs';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
} from '@performa-edu/proto-types/auth-service';
import { ClientGrpc } from '@nestjs/microservices';

@Injectable()
export class TeacherService implements OnModuleInit {
  private authService: AuthServiceClient;
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private readonly client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler,
    private readonly teacherRepository: TeacherRepository
  ) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async getAllTeachers(
    options: GetAllTeachersRequest
  ): Promise<GetAllTeachersResponse> {
    const { data, meta } = await this.teacherRepository.getAllTeachers(options);

    const transformedData = transformResponse<Teacher[]>(data);

    const result = await Promise.all(
      transformedData.map(async (tchr: Teacher) => ({
        ...tchr,
        user: await handleGrpcCall(
          this.authService.getUserById({ id: tchr.userId }),
          this.grpcErrorHandler,
          'Failed to fetch user data'
        ),
      }))
    );

    return { teachers: result, meta };
  }

  async getTeacherById(id: string): Promise<GetTeacherByIdResponse> {
    const { data } = await this.teacherRepository.getTeacherById(id);

    const transformedData = transformResponse<Teacher>(data);

    const user = await handleGrpcCall(
      this.authService.getUserById({ id: transformedData.userId }),
      this.grpcErrorHandler,
      'Failed to fetch user data'
    );

    const teacherWithUser = {
      ...transformedData,
      user,
    };

    return { teacher: teacherWithUser };
  }

  async createTeacher(
    options: CreateTeacherRequest
  ): Promise<CreateTeacherResponse> {
    const data = await this.teacherRepository.createTeacher(options);

    return {
      teacher: data.teacher,
    };
  }

  async getProfilePictureUploadUrl(
    options: ProfilePictureUploadUrlRequest
  ): Promise<ProfilePictureUploadUrlResponse> {
    return await this.teacherRepository.getProfilePictureUploadUrl(options);
  }

  async updateTeacher(
    id: string,
    options: UpdateTeacherRequest
  ): Promise<UpdateTeacherResponse> {
    const data = await this.teacherRepository.updateTeacher(id, options);
    return { teacher: data.teacher };
  }

  async deleteTeacher(
    options: DeleteTeacherRequest
  ): Promise<DeleteTeacherResponse> {
    return await this.teacherRepository.deleteTeacher(options);
  }
}
