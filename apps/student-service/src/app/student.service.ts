import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StudentRepository } from './repositories/student.repository';
import { AssignmentRepository } from './repositories/assignment.repository';
import { ProgressRepository } from './repositories/progress.repository';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  GetStudentByIdRequest,
  GetStudentByIdResponse,
  GetStudentByUserIdRequest,
  GetStudentByUserIdResponse,
  UpdateStudentRequest,
  UpdateStudentResponse,
  DeleteStudentRequest,
  DeleteStudentResponse,
  GetAllStudentsRequest,
  GetAllStudentsResponse,
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  BulkCreateAssignmentsRequest,
  BulkCreateAssignmentsResponse,
  DeleteAssignmentRequest,
  DeleteAssignmentResponse,
  GetAssignmentRequest,
  GetAssignmentResponse,
  GetStudentAssignmentsRequest,
  GetStudentAssignmentsResponse,
  GetTeacherAssignmentsRequest,
  GetTeacherAssignmentsResponse,
  GetContentAssignmentsRequest,
  GetContentAssignmentsResponse,
  UpdateProgressRequest,
  UpdateProgressResponse,
  GetProgressLogsRequest,
  GetProgressLogsResponse,
  ProfilePictureUploadUrlRequest,
  ProfilePictureUploadUrlResponse,
  Student,
} from '@performa-edu/proto-types/student-service';
import {
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
export class StudentService implements OnModuleInit {
  private authService: AuthServiceClient;
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private readonly client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler,
    private readonly studentRepository: StudentRepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly progressRepository: ProgressRepository
  ) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  // ── Student CRUD ──

  async registerStudent(
    options: RegisterStudentRequest
  ): Promise<RegisterStudentResponse> {
    return this.studentRepository.registerStudent(options);
  }

  async getProfilePictureUploadUrl(
    options: ProfilePictureUploadUrlRequest
  ): Promise<ProfilePictureUploadUrlResponse> {
    return this.studentRepository.getProfilePictureUploadUrl(options);
  }

  async getAllStudents(
    options: GetAllStudentsRequest
  ): Promise<GetAllStudentsResponse> {
    const { data, meta } = await this.studentRepository.getAllStudents(options);

    const transformedData = transformResponse<Student[]>(data);

    const result = await Promise.all(
      transformedData.map(async (student: Student) => ({
        ...student,
        user: await handleGrpcCall(
          this.authService.getUserById({ id: student.userId }),
          this.grpcErrorHandler,
          'Failed to fetch user data'
        ),
      }))
    );

    return { students: result, meta };
  }

  async getStudentById(
    options: GetStudentByIdRequest
  ): Promise<GetStudentByIdResponse> {
    const { data } = await this.studentRepository.getStudentById(options.id);

    const transformedData = transformResponse<Student>(data);

    const user = await handleGrpcCall(
      this.authService.getUserById({ id: transformedData.userId }),
      this.grpcErrorHandler,
      'Failed to fetch user data'
    );

    return { student: { ...transformedData, user } };
  }

  async getStudentByUserId(
    options: GetStudentByUserIdRequest
  ): Promise<GetStudentByUserIdResponse> {
    const { data } = await this.studentRepository.getStudentByUserId(
      options.userId
    );

    const transformedData = transformResponse<Student>(data);

    const user = await handleGrpcCall(
      this.authService.getUserById({ id: transformedData.userId }),
      this.grpcErrorHandler,
      'Failed to fetch user data'
    );

    return { student: { ...transformedData, user } };
  }

  async updateStudent(
    options: UpdateStudentRequest
  ): Promise<UpdateStudentResponse> {
    return this.studentRepository.updateStudent(options.id, options);
  }

  async deleteStudent(
    options: DeleteStudentRequest
  ): Promise<DeleteStudentResponse> {
    return this.studentRepository.deleteStudent(options);
  }

  // ── Assignment management ──

  async createAssignment(
    options: CreateAssignmentRequest
  ): Promise<CreateAssignmentResponse> {
    return this.assignmentRepository.createAssignment(options);
  }

  async bulkCreateAssignments(
    options: BulkCreateAssignmentsRequest
  ): Promise<BulkCreateAssignmentsResponse> {
    return this.assignmentRepository.bulkCreateAssignments(options);
  }

  async deleteAssignment(
    options: DeleteAssignmentRequest
  ): Promise<DeleteAssignmentResponse> {
    return this.assignmentRepository.deleteAssignment(options);
  }

  async getAssignment(
    options: GetAssignmentRequest
  ): Promise<GetAssignmentResponse> {
    return this.assignmentRepository.getAssignment(options);
  }

  // ── Query assignments ──

  async getStudentAssignments(
    options: GetStudentAssignmentsRequest
  ): Promise<GetStudentAssignmentsResponse> {
    const { data, meta } =
      await this.assignmentRepository.getStudentAssignments(options);
    return { assignments: data, meta };
  }

  async getTeacherAssignments(
    options: GetTeacherAssignmentsRequest
  ): Promise<GetTeacherAssignmentsResponse> {
    const { data, meta } =
      await this.assignmentRepository.getTeacherAssignments(options);
    return { assignments: data, meta };
  }

  async getContentAssignments(
    options: GetContentAssignmentsRequest
  ): Promise<GetContentAssignmentsResponse> {
    const { data, meta, totalAssigned } =
      await this.assignmentRepository.getContentAssignments(options);
    return { assignments: data, meta, totalAssigned };
  }

  // ── Progress tracking ──

  async updateProgress(
    options: UpdateProgressRequest
  ): Promise<UpdateProgressResponse> {
    return this.progressRepository.updateProgress(options);
  }

  async getProgressLogs(
    options: GetProgressLogsRequest
  ): Promise<GetProgressLogsResponse> {
    return this.progressRepository.getProgressLogs(options);
  }
}
