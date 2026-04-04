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
  GetAllBranchesDto,
  CreateBranchDto,
  UpdateBranchDto,
  AssignTeachersToBranchDto,
  AssignStudentsToBranchDto,
} from '@performa-edu/libs';
import {
  BRANCH_SERVICE_NAME,
  BRANCHSERVICE_PACKAGE_NAME,
  BranchServiceClient,
  GetAllBranchesResponse,
  GetBranchByIdResponse,
  CreateBranchResponse,
  UpdateBranchResponse,
  DeleteBranchResponse,
  AssignTeacherToBranchResponse,
  UnassignTeacherFromBranchResponse,
  GetBranchTeachersResponse,
  AssignStudentToBranchResponse,
  UnassignStudentFromBranchResponse,
  GetBranchStudentsResponse,
} from '@performa-edu/proto-types/branch-service';
import { AclAction, AclSubject } from 'libs/src/constant';

@Controller({
  version: '1',
  path: 'branches',
})
export class BranchController implements OnModuleInit {
  private branchService: BranchServiceClient;

  constructor(
    @Inject(BRANCHSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.branchService =
      this.client.getService<BranchServiceClient>(BRANCH_SERVICE_NAME);
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.BRANCH }])
  @Get()
  async getBranches(@Query() options: GetAllBranchesDto): Promise<{
    data: GetAllBranchesResponse['branches'];
    meta: GetAllBranchesResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.branchService.getAllBranches(options),
      this.grpcErrorHandler,
      'Failed to fetch branches'
    );

    return {
      data: result.branches,
      meta: result.meta,
    };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.BRANCH }])
  @Get(':id')
  async getBranchById(@Param('id') id: string): Promise<{
    data: GetBranchByIdResponse['branch'];
  }> {
    const result = await handleGrpcCall(
      this.branchService.getBranchById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch branch by ID'
    );

    return { data: result.branch };
  }

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.BRANCH }])
  @Post()
  async createBranch(
    @Body() body: CreateBranchDto,
    @Req() req: any
  ): Promise<{
    data: CreateBranchResponse['branch'];
  }> {
    const result = await handleGrpcCall(
      this.branchService.createBranch({
        name: body.name,
        address: body.address,
        phone: body.phone,
        adminId: req.user?.id || req.user?.userId,
        adminName: req.user?.fullName || req.user?.name || '',
      }),
      this.grpcErrorHandler,
      'Failed to create branch'
    );

    return { data: result.branch };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.BRANCH }])
  @Put(':id')
  async updateBranch(
    @Param('id') id: string,
    @Body() body: UpdateBranchDto
  ): Promise<{
    data: UpdateBranchResponse['branch'];
  }> {
    const result = await handleGrpcCall(
      this.branchService.updateBranch({ id, ...body }),
      this.grpcErrorHandler,
      'Failed to update branch'
    );

    return { data: result.branch };
  }

  @Auth([{ action: AclAction.DELETE, subject: AclSubject.BRANCH }])
  @Delete(':id')
  async deleteBranch(@Param('id') id: string): Promise<{
    data: DeleteBranchResponse;
  }> {
    const result = await handleGrpcCall(
      this.branchService.deleteBranch({ id }),
      this.grpcErrorHandler,
      'Failed to delete branch'
    );

    return { data: result };
  }

  // --- Teacher membership ---

  @Auth([{ action: AclAction.READ, subject: AclSubject.BRANCH }])
  @Get(':id/teachers')
  async getBranchTeachers(
    @Param('id') id: string,
    @Query() query: { page?: number; pageSize?: number; search?: string }
  ): Promise<{
    data: GetBranchTeachersResponse['teachers'];
    meta: GetBranchTeachersResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.branchService.getBranchTeachers({
        branchId: id,
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
      }),
      this.grpcErrorHandler,
      'Failed to fetch branch teachers'
    );

    return { data: result.teachers, meta: result.meta };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.BRANCH }])
  @Post(':id/teachers')
  async assignTeacherToBranch(
    @Param('id') id: string,
    @Body() body: AssignTeachersToBranchDto
  ): Promise<{
    data: AssignTeacherToBranchResponse;
  }> {
    const result = await handleGrpcCall(
      this.branchService.assignTeacherToBranch({
        branchId: id,
        teacherIds: body.teacherIds,
      }),
      this.grpcErrorHandler,
      'Failed to assign teachers to branch'
    );

    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.BRANCH }])
  @Delete(':id/teachers/:teacherId')
  async unassignTeacherFromBranch(
    @Param('id') id: string,
    @Param('teacherId') teacherId: string
  ): Promise<{
    data: UnassignTeacherFromBranchResponse;
  }> {
    const result = await handleGrpcCall(
      this.branchService.unassignTeacherFromBranch({
        branchId: id,
        teacherId,
      }),
      this.grpcErrorHandler,
      'Failed to unassign teacher from branch'
    );

    return { data: result };
  }

  // --- Student membership ---

  @Auth([{ action: AclAction.READ, subject: AclSubject.BRANCH }])
  @Get(':id/students')
  async getBranchStudents(
    @Param('id') id: string,
    @Query() query: { page?: number; pageSize?: number; search?: string }
  ): Promise<{
    data: GetBranchStudentsResponse['students'];
    meta: GetBranchStudentsResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.branchService.getBranchStudents({
        branchId: id,
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
      }),
      this.grpcErrorHandler,
      'Failed to fetch branch students'
    );

    return { data: result.students, meta: result.meta };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.BRANCH }])
  @Post(':id/students')
  async assignStudentToBranch(
    @Param('id') id: string,
    @Body() body: AssignStudentsToBranchDto
  ): Promise<{
    data: AssignStudentToBranchResponse;
  }> {
    const result = await handleGrpcCall(
      this.branchService.assignStudentToBranch({
        branchId: id,
        studentIds: body.studentIds,
      }),
      this.grpcErrorHandler,
      'Failed to assign students to branch'
    );

    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.BRANCH }])
  @Delete(':id/students/:studentId')
  async unassignStudentFromBranch(
    @Param('id') id: string,
    @Param('studentId') studentId: string
  ): Promise<{
    data: UnassignStudentFromBranchResponse;
  }> {
    const result = await handleGrpcCall(
      this.branchService.unassignStudentFromBranch({
        branchId: id,
        studentId,
      }),
      this.grpcErrorHandler,
      'Failed to unassign student from branch'
    );

    return { data: result };
  }
}
