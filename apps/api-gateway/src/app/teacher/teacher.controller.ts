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
import { ClientGrpc, GrpcMethod } from '@nestjs/microservices';
import {
  Auth,
  GetAllTeacherDto,
  GrpcErrorHandler,
  handleGrpcCall,
  UpdateTeacherDto,
} from '@performa-edu/libs';
import {
  CreateTeacherRequest,
  CreateTeacherResponse,
  Teacher,
  TEACHER_SERVICE_NAME,
  TEACHERSERVICE_PACKAGE_NAME,
  TeacherServiceClient,
  DeleteTeacherResponse,
  GetAllTeachersResponse,
  GetTeacherByIdResponse,
  UpdateTeacherResponse,
} from '@performa-edu/proto-types/teacher-service';
import { AclAction, AclSubject } from 'libs/src/constant';

@Controller({
  version: '1',
  path: 'teachers',
})
export class TeacherController implements OnModuleInit {
  private teacherService: TeacherServiceClient;

  constructor(
    @Inject(TEACHERSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.teacherService = this.client.getService<TeacherServiceClient>(
      TEACHER_SERVICE_NAME
    );
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
  async createTeacher(@Body() options: CreateTeacherRequest): Promise<{
    data: CreateTeacherResponse['teacher'];
  }> {
    const result = await handleGrpcCall(
      this.teacherService.createTeacher(options),
      this.grpcErrorHandler,
      'Failed to create teacher'
    );

    return {
      data: result.teacher,
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
