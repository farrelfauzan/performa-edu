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
  AuthUser,
  GrpcErrorHandler,
  handleGrpcCall,
  LoggedUserType,
  CreateAssignmentDto,
  BulkCreateAssignmentsDto,
  UpdateProgressDto,
} from '@performa-edu/libs';
import {
  STUDENT_SERVICE_NAME,
  STUDENTSERVICE_PACKAGE_NAME,
  StudentServiceClient,
  ProgressAction,
} from '@performa-edu/proto-types/student-service';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
} from '@performa-edu/proto-types/auth-service';
import { AclAction, AclSubject } from 'libs/src/constant';

@Controller({
  version: '1',
  path: 'assignments',
})
export class AssignmentController implements OnModuleInit {
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

  // Teacher creates assignment
  @Auth([{ action: AclAction.CREATE, subject: AclSubject.ASSIGNMENT }])
  @Post()
  async createAssignment(
    @AuthUser() user: LoggedUserType,
    @Body() body: CreateAssignmentDto
  ) {
    const teacherId = await this.resolveTeacherId(user.userId);

    const result = await handleGrpcCall(
      this.studentService.createAssignment({
        teacherId,
        studentId: body.studentId,
        contentId: body.contentId,
        dueDate: body.dueDate,
      }),
      this.grpcErrorHandler,
      'Failed to create assignment'
    );

    return { data: result.assignment };
  }

  // Teacher bulk assigns
  @Auth([{ action: AclAction.CREATE, subject: AclSubject.ASSIGNMENT }])
  @Post('bulk')
  async bulkCreateAssignments(
    @AuthUser() user: LoggedUserType,
    @Body() body: BulkCreateAssignmentsDto
  ) {
    const teacherId = await this.resolveTeacherId(user.userId);

    const result = await handleGrpcCall(
      this.studentService.bulkCreateAssignments({
        teacherId,
        studentIds: body.studentIds,
        contentId: body.contentId,
        dueDate: body.dueDate,
      }),
      this.grpcErrorHandler,
      'Failed to bulk create assignments'
    );

    return {
      data: result.assignments,
      created: result.created,
      skipped: result.skipped,
    };
  }

  // Teacher removes assignment
  @Auth([{ action: AclAction.DELETE, subject: AclSubject.ASSIGNMENT }])
  @Delete(':studentId/:contentId')
  async deleteAssignment(
    @AuthUser() user: LoggedUserType,
    @Param('studentId') studentId: string,
    @Param('contentId') contentId: string
  ) {
    const teacherId = await this.resolveTeacherId(user.userId);

    const result = await handleGrpcCall(
      this.studentService.deleteAssignment({ teacherId, studentId, contentId }),
      this.grpcErrorHandler,
      'Failed to delete assignment'
    );

    return { data: result };
  }

  // Student: my assignments
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('my')
  async getMyAssignments(
    @AuthUser() user: LoggedUserType,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    // Resolve student ID from user
    const studentResult = await handleGrpcCall(
      this.studentService.getStudentByUserId({ userId: user.userId }),
      this.grpcErrorHandler,
      'Failed to resolve student'
    );

    const result = await handleGrpcCall(
      this.studentService.getStudentAssignments({
        studentId: studentResult.student.id,
        ...(page ? { page: parseInt(page) } : {}),
        ...(pageSize ? { pageSize: parseInt(pageSize) } : {}),
      }),
      this.grpcErrorHandler,
      'Failed to fetch assignments'
    );

    return { data: result.assignments, meta: result.meta };
  }

  // Teacher/Admin: assignments for a specific student
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('student/:studentId')
  async getStudentAssignments(
    @Param('studentId') studentId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const result = await handleGrpcCall(
      this.studentService.getStudentAssignments({
        studentId,
        ...(page ? { page: parseInt(page) } : {}),
        ...(pageSize ? { pageSize: parseInt(pageSize) } : {}),
      }),
      this.grpcErrorHandler,
      'Failed to fetch student assignments'
    );

    return { data: result.assignments, meta: result.meta };
  }

  // Teacher: assignments I created
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('teacher')
  async getTeacherAssignments(
    @AuthUser() user: LoggedUserType,
    @Query('contentId') contentId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const teacherId = await this.resolveTeacherId(user.userId);

    const result = await handleGrpcCall(
      this.studentService.getTeacherAssignments({
        teacherId,
        ...(contentId ? { contentId } : {}),
        ...(page ? { page: parseInt(page) } : {}),
        ...(pageSize ? { pageSize: parseInt(pageSize) } : {}),
      }),
      this.grpcErrorHandler,
      'Failed to fetch teacher assignments'
    );

    return { data: result.assignments, meta: result.meta };
  }

  // Teacher/Admin: who has this content
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get('content/:contentId')
  async getContentAssignments(
    @Param('contentId') contentId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const result = await handleGrpcCall(
      this.studentService.getContentAssignments({
        contentId,
        ...(page ? { page: parseInt(page) } : {}),
        ...(pageSize ? { pageSize: parseInt(pageSize) } : {}),
      }),
      this.grpcErrorHandler,
      'Failed to fetch content assignments'
    );

    return {
      data: result.assignments,
      meta: result.meta,
      totalAssigned: result.totalAssigned,
    };
  }

  // Student: log progress action
  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.ASSIGNMENT }])
  @Put('progress')
  async updateProgress(
    @AuthUser() user: LoggedUserType,
    @Body() body: UpdateProgressDto
  ) {
    // Resolve student ID from user
    const studentResult = await handleGrpcCall(
      this.studentService.getStudentByUserId({ userId: user.userId }),
      this.grpcErrorHandler,
      'Failed to resolve student'
    );

    const actionMap: Record<string, ProgressAction> = {
      COMPLETE_SECTION: ProgressAction.COMPLETE_SECTION,
      ANSWER_QUESTION: ProgressAction.ANSWER_QUESTION,
    };

    const result = await handleGrpcCall(
      this.studentService.updateProgress({
        studentId: studentResult.student.id,
        contentId: body.contentId,
        action: actionMap[body.action],
        sectionId: body.sectionId,
        questionId: body.questionId,
      }),
      this.grpcErrorHandler,
      'Failed to update progress'
    );

    return { data: result.assignment, alreadyLogged: result.alreadyLogged };
  }

  // Student/Teacher: view detailed progress logs
  @Auth([{ action: AclAction.READ, subject: AclSubject.ASSIGNMENT }])
  @Get(':studentId/:contentId/progress')
  async getProgressLogs(
    @Param('studentId') studentId: string,
    @Param('contentId') contentId: string
  ) {
    // First get the assignment to find assignmentId
    const assignment = await handleGrpcCall(
      this.studentService.getAssignment({ studentId, contentId }),
      this.grpcErrorHandler,
      'Failed to fetch assignment'
    );

    const result = await handleGrpcCall(
      this.studentService.getProgressLogs({
        assignmentId: assignment.assignment.id,
      }),
      this.grpcErrorHandler,
      'Failed to fetch progress logs'
    );

    return {
      data: result.logs,
      progress: result.progress,
      completedItems: result.completedItems,
      totalItems: result.totalItems,
    };
  }

  private async resolveTeacherId(userId: string): Promise<string> {
    const profile = await handleGrpcCall(
      this.authService.getMe({ userId }),
      this.grpcErrorHandler,
      'Failed to resolve teacher profile'
    );

    if (!profile.id) {
      throw new Error('User does not have a teacher profile');
    }

    return profile.id;
  }
}
