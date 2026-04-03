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
  Req,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  GrpcErrorHandler,
  handleGrpcCall,
  GetAllClassesDto,
  CreateClassDto,
  UpdateClassDto,
  AddTeachersToClassDto,
  AddStudentsToClassDto,
} from '@performa-edu/libs';
import {
  CLASS_SERVICE_NAME,
  CLASSSERVICE_PACKAGE_NAME,
  ClassServiceClient,
  GetAllClassesResponse,
  GetClassByIdResponse,
  CreateClassResponse,
  UpdateClassResponse,
  DeleteClassResponse,
  AddTeacherToClassResponse,
  RemoveTeacherFromClassResponse,
  GetClassTeachersResponse,
  AddStudentToClassResponse,
  RemoveStudentFromClassResponse,
  GetClassStudentsResponse,
  GetStudentClassesResponse,
} from '@performa-edu/proto-types/class-service';
import { AclAction, AclSubject } from 'libs/src/constant';

@Controller({
  version: '1',
  path: 'classes',
})
export class ClassController implements OnModuleInit {
  private classService: ClassServiceClient;

  constructor(
    @Inject(CLASSSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.classService =
      this.client.getService<ClassServiceClient>(CLASS_SERVICE_NAME);
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.CLASS }])
  @Get()
  async getClasses(@Query() options: GetAllClassesDto): Promise<{
    data: GetAllClassesResponse['classes'];
    meta: GetAllClassesResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.classService.getAllClasses(options),
      this.grpcErrorHandler,
      'Failed to fetch classes'
    );

    return {
      data: result.classes,
      meta: result.meta,
    };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.CLASS }])
  @Get(':id')
  async getClassById(@Param('id') id: string): Promise<{
    data: GetClassByIdResponse['class'];
  }> {
    const result = await handleGrpcCall(
      this.classService.getClassById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch class by ID'
    );

    return { data: result.class };
  }

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.CLASS }])
  @Post()
  async createClass(
    @Body() body: CreateClassDto,
    @Req() req: any
  ): Promise<{
    data: CreateClassResponse['class'];
  }> {
    const result = await handleGrpcCall(
      this.classService.createClass({
        createdBy: req.user?.id || req.user?.userId,
        name: body.name,
        description: body.description,
      }),
      this.grpcErrorHandler,
      'Failed to create class'
    );

    return { data: result.class };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.CLASS }])
  @Put(':id')
  async updateClass(
    @Param('id') id: string,
    @Body() body: UpdateClassDto
  ): Promise<{
    data: UpdateClassResponse['class'];
  }> {
    const result = await handleGrpcCall(
      this.classService.updateClass({ id, ...body }),
      this.grpcErrorHandler,
      'Failed to update class'
    );

    return { data: result.class };
  }

  @Auth([{ action: AclAction.DELETE, subject: AclSubject.CLASS }])
  @Delete(':id')
  async deleteClass(@Param('id') id: string): Promise<{
    data: DeleteClassResponse;
  }> {
    const result = await handleGrpcCall(
      this.classService.deleteClass({ id }),
      this.grpcErrorHandler,
      'Failed to delete class'
    );

    return { data: result };
  }

  // --- Teacher membership ---

  @Auth([{ action: AclAction.READ, subject: AclSubject.CLASS }])
  @Get(':id/teachers')
  async getClassTeachers(
    @Param('id') id: string,
    @Query() query: { page?: number; pageSize?: number; search?: string }
  ): Promise<{
    data: GetClassTeachersResponse['teachers'];
    meta: GetClassTeachersResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.classService.getClassTeachers({
        classId: id,
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
      }),
      this.grpcErrorHandler,
      'Failed to fetch class teachers'
    );

    return { data: result.teachers, meta: result.meta };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.CLASS }])
  @Post(':id/teachers')
  async addTeacherToClass(
    @Param('id') id: string,
    @Body() body: AddTeachersToClassDto
  ): Promise<{
    data: AddTeacherToClassResponse;
  }> {
    const result = await handleGrpcCall(
      this.classService.addTeacherToClass({
        classId: id,
        customerIds: body.customerIds,
      }),
      this.grpcErrorHandler,
      'Failed to add teachers to class'
    );

    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.CLASS }])
  @Delete(':id/teachers/:customerId')
  async removeTeacherFromClass(
    @Param('id') id: string,
    @Param('customerId') customerId: string
  ): Promise<{
    data: RemoveTeacherFromClassResponse;
  }> {
    const result = await handleGrpcCall(
      this.classService.removeTeacherFromClass({
        classId: id,
        customerId,
      }),
      this.grpcErrorHandler,
      'Failed to remove teacher from class'
    );

    return { data: result };
  }

  // --- Student membership ---

  @Auth([{ action: AclAction.READ, subject: AclSubject.CLASS }])
  @Get(':id/students')
  async getClassStudents(
    @Param('id') id: string,
    @Query() query: { page?: number; pageSize?: number; search?: string }
  ): Promise<{
    data: GetClassStudentsResponse['students'];
    meta: GetClassStudentsResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.classService.getClassStudents({
        classId: id,
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
      }),
      this.grpcErrorHandler,
      'Failed to fetch class students'
    );

    return { data: result.students, meta: result.meta };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.CLASS }])
  @Post(':id/students')
  async addStudentToClass(
    @Param('id') id: string,
    @Body() body: AddStudentsToClassDto
  ): Promise<{
    data: AddStudentToClassResponse;
  }> {
    const result = await handleGrpcCall(
      this.classService.addStudentToClass({
        classId: id,
        studentIds: body.studentIds,
      }),
      this.grpcErrorHandler,
      'Failed to add students to class'
    );

    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.CLASS }])
  @Delete(':id/students/:studentId')
  async removeStudentFromClass(
    @Param('id') id: string,
    @Param('studentId') studentId: string
  ): Promise<{
    data: RemoveStudentFromClassResponse;
  }> {
    const result = await handleGrpcCall(
      this.classService.removeStudentFromClass({
        classId: id,
        studentId,
      }),
      this.grpcErrorHandler,
      'Failed to remove student from class'
    );

    return { data: result };
  }
}
