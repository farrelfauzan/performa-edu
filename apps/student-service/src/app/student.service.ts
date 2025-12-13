import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StudentRepository } from './repositories/student.repository';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import {
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
} from '@performa-edu/proto-types/auth-service';
import {
  GrpcErrorHandler,
  handleGrpcCall,
  PageMeta,
  StudentType,
} from '@performa-edu/libs';
import {
  GetAllStudentsRequest,
  UpdateStudentByIdRequest,
} from '@performa-edu/proto-types/student-service';

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

  async findAllStudents(options: GetAllStudentsRequest): Promise<{
    data: StudentType[];
    meta: PageMeta;
  }> {
    try {
      const students = await this.studentRepository.findAllStudents(options);

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

      return { data: result, meta: students.meta };
    } catch (error) {
      this.logger.error('Error in findAllStudents:', error);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'An error occurred while retrieving students.',
      });
    }
  }

  async findStudentById(id: string): Promise<{ data: StudentType }> {
    try {
      const student = await this.studentRepository.findStudentById(id);

      const user = await handleGrpcCall(
        this.authService.getUserById({ id: student.data.userId }),
        this.grpcErrorHandler,
        'Failed to fetch user data'
      );

      return { data: { ...student.data, user } };
    } catch (error) {
      this.logger.error(`Error in findStudentById for id ${id}:`, error);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'An error occurred while retrieving the student.',
      });
    }
  }

  async findStudentByUserId(userId: string): Promise<{ data: StudentType }> {
    try {
      const student = await this.studentRepository.findStudentsByUserId(userId);

      const user = await handleGrpcCall(
        this.authService.getUserById({ id: student.data.userId }),
        this.grpcErrorHandler,
        'Failed to fetch user data'
      );

      return { data: { ...student.data, user } };
    } catch (error) {
      this.logger.error(
        `Error in findStudentByUserId for userId ${userId}:`,
        error
      );
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'An error occurred while retrieving the student.',
      });
    }
  }

  async updateStudentById(
    options: Partial<UpdateStudentByIdRequest> & { id: string }
  ): Promise<{ data: StudentType }> {
    try {
      const student = await this.studentRepository.updateStudentById(options);

      const user = await handleGrpcCall(
        this.authService.getUserById({ id: student.data.userId }),
        this.grpcErrorHandler,
        'Failed to fetch user data'
      );

      return { data: { ...student.data, user } };
    } catch (error) {
      this.logger.error(
        `Error in updateStudentById for id ${options.id}:`,
        error
      );
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'An error occurred while updating the student.',
      });
    }
  }

  async deleteStudentById(id: string): Promise<{ message: string }> {
    try {
      const result = await this.studentRepository.deleteStudentById(id);
      return { message: result.message };
    } catch (error) {
      this.logger.error(`Error in deleteStudentById for id ${id}:`, error);
      throw new RpcException({
        code: 13, // INTERNAL
        message: 'An error occurred while deleting the student.',
      });
    }
  }
}
