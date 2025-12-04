import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StudentRepository } from './repositories/student.repository';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import {
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
} from '@performa-edu/proto-types/auth-service';
import { GetAllStudentsDto } from './dtos/get-all-students.dto';
import { Student } from './dtos/student.dto';
import { GrpcErrorHandler, handleGrpcCall, PageMeta } from '@performa-edu/libs';

@Injectable()
export class StudentService implements OnModuleInit {
  private authService: AuthServiceClient;
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private readonly client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler,
    private readonly studentRepository: StudentRepository
  ) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  async findAllStudents(options: GetAllStudentsDto): Promise<{
    data: Student[];
    meta: PageMeta;
  }> {
    try {
      const students = await this.studentRepository.findAllStudents(options);

      console.log('Students fetched from repository:', students);

      const result = await Promise.all(
        students.data.map(async (st) => ({
          ...st,
          user: await handleGrpcCall(
            this.authService.getUserById({ id: st.userId }),
            this.grpcErrorHandler,
            'Failed to fetch user data'
          ),
        }))
      );

      console.log('Students with user data:', result);

      return { data: result, meta: students.meta };
    } catch (error) {
      this.logger.error('Error in findAllStudents:', error);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'An error occurred while retrieving students.',
      });
    }
  }
}
