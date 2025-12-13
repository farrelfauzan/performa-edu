import {
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  GetAllStudentsRequest,
  STUDENT_SERVICE_NAME,
  StudentResponse,
  STUDENTSERVICE_PACKAGE_NAME,
  StudentServiceClient,
} from '@performa-edu/proto-types/student-service';
import {
  GrpcErrorHandler,
  handleGrpcCall,
  PageMeta,
  UpdateStudentDto,
} from '@performa-edu/libs';

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
  async getAllStudents(@Query() options: GetAllStudentsRequest): Promise<{
    data: StudentResponse[];
    meta: PageMeta;
  }> {
    const response = await handleGrpcCall(
      this.studentService.findAllStudents(options),
      this.grpcErrorHandler,
      'Failed to fetch students'
    );

    return {
      data: response.data || [],
      meta: response.meta,
    };
  }

  @Get(':id')
  async getStudentById(@Param('id') id: string): Promise<StudentResponse> {
    const response = await handleGrpcCall(
      this.studentService.findStudentById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch student by ID'
    );
    return response;
  }

  @Get('user/:userId')
  async getStudentByUserId(
    @Param('userId') userId: string
  ): Promise<StudentResponse> {
    const response = await handleGrpcCall(
      this.studentService.findStudentByUserId({ userId }),
      this.grpcErrorHandler,
      'Failed to fetch student by user ID'
    );
    return response;
  }

  @Put(':id')
  async updateStudentById(
    @Param('id') id: string,
    @Param() updateData: UpdateStudentDto
  ): Promise<StudentResponse> {
    const response = await handleGrpcCall(
      this.studentService.updateStudentById({ id, ...updateData }),
      this.grpcErrorHandler,
      'Failed to update student by ID'
    );
    return response;
  }

  @Delete(':id')
  async deleteStudentById(
    @Param('id') id: string
  ): Promise<{ message: string }> {
    const response = await handleGrpcCall(
      this.studentService.deleteStudentById({ id }),
      this.grpcErrorHandler,
      'Failed to delete student by ID'
    );
    return response;
  }
}
