import { Controller, Get, Inject, OnModuleInit, Param } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  GetAllStudentsRequest,
  STUDENT_SERVICE_NAME,
  StudentResponse,
  STUDENTSERVICE_PACKAGE_NAME,
  StudentServiceClient,
} from '@performa-edu/proto-types/student-service';
import { GrpcErrorHandler, handleGrpcCall, PageMeta } from '@performa-edu/libs';

@Controller({
  version: '1',
  path: 'students',
})
export class StudentController implements OnModuleInit {
  private studentService: StudentServiceClient;

  constructor(
    @Inject(STUDENTSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.studentService =
      this.client.getService<StudentServiceClient>(STUDENT_SERVICE_NAME);
  }

  @Get()
  async getAllStudents(@Param() options: GetAllStudentsRequest): Promise<{
    data: StudentResponse[];
    meta: PageMeta;
  }> {
    const response = await handleGrpcCall(
      this.studentService.findAllStudents(options),
      this.grpcErrorHandler,
      'Failed to fetch students'
    );
    return {
      data: response.students,
      meta: response.meta,
    };
  }
}
