import { Injectable } from '@nestjs/common';
import { IAssignmentRepository } from '../interfaces/assignment.interface';
import {
  PageMeta,
  PageMetaDto,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import {
  Assignment,
  CreateAssignmentRequest,
  CreateAssignmentResponse,
  BulkCreateAssignmentsRequest,
  BulkCreateAssignmentsResponse,
  DeleteAssignmentRequest,
  DeleteAssignmentResponse,
  GetAssignmentRequest,
  GetAssignmentResponse,
  GetStudentAssignmentsRequest,
  GetTeacherAssignmentsRequest,
  GetContentAssignmentsRequest,
  AssignmentStatus,
} from '@performa-edu/proto-types/student-service';
import {
  AssignmentNotFoundError,
  AssignmentAlreadyExistsError,
} from '../errors/student.errors';
import { AssignmentStatus as PrismaAssignmentStatus } from '@performa-edu/libs';

@Injectable()
export class AssignmentRepository implements IAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAssignment(
    options: CreateAssignmentRequest
  ): Promise<CreateAssignmentResponse> {
    const existing = await this.prisma.assignment.findUnique({
      where: {
        studentId_contentId: {
          studentId: options.studentId,
          contentId: options.contentId,
        },
      },
    });

    if (existing) {
      AssignmentAlreadyExistsError(options.studentId, options.contentId);
    }

    const assignment = await this.prisma.assignment.create({
      data: {
        teacherId: options.teacherId,
        studentId: options.studentId,
        contentId: options.contentId,
        ...(options.dueDate ? { dueDate: new Date(options.dueDate) } : {}),
      },
      include: { student: true },
    });

    return {
      assignment: transformResponse<Assignment>(assignment as any),
    };
  }

  async bulkCreateAssignments(
    options: BulkCreateAssignmentsRequest
  ): Promise<BulkCreateAssignmentsResponse> {
    const assignments: Assignment[] = [];
    let created = 0;
    let skipped = 0;

    for (const studentId of options.studentIds) {
      const existing = await this.prisma.assignment.findUnique({
        where: {
          studentId_contentId: {
            studentId,
            contentId: options.contentId,
          },
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const assignment = await this.prisma.assignment.create({
        data: {
          teacherId: options.teacherId,
          studentId,
          contentId: options.contentId,
          ...(options.dueDate ? { dueDate: new Date(options.dueDate) } : {}),
        },
        include: { student: true },
      });

      assignments.push(transformResponse<Assignment>(assignment as any));
      created++;
    }

    return { assignments, created, skipped };
  }

  async deleteAssignment(
    options: DeleteAssignmentRequest
  ): Promise<DeleteAssignmentResponse> {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        studentId_contentId: {
          studentId: options.studentId,
          contentId: options.contentId,
        },
      },
    });

    if (!assignment) {
      AssignmentNotFoundError(options.studentId, options.contentId);
    }

    await this.prisma.assignment.delete({
      where: { id: assignment.id },
    });

    return { message: 'Assignment deleted successfully' };
  }

  async getAssignment(
    options: GetAssignmentRequest
  ): Promise<GetAssignmentResponse> {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        studentId_contentId: {
          studentId: options.studentId,
          contentId: options.contentId,
        },
      },
      include: { student: true },
    });

    if (!assignment) {
      AssignmentNotFoundError(options.studentId, options.contentId);
    }

    return {
      assignment: transformResponse<Assignment>(assignment as any),
    };
  }

  async getStudentAssignments(
    options: GetStudentAssignmentsRequest
  ): Promise<{ data: Assignment[]; meta: PageMetaDto }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    const where: any = { studentId: options.studentId };
    if (options.status !== undefined && options.status !== null) {
      where.status = this.mapStatusToDb(options.status);
    }

    const [data, count] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: { student: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    const meta: PageMeta = { page, pageSize, count };

    return {
      data: transformResponse<Assignment[]>(data as any),
      meta,
    };
  }

  async getTeacherAssignments(
    options: GetTeacherAssignmentsRequest
  ): Promise<{ data: Assignment[]; meta: PageMetaDto }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    const where: any = { teacherId: options.teacherId };
    if (options.contentId) {
      where.contentId = options.contentId;
    }
    if (options.status !== undefined && options.status !== null) {
      where.status = this.mapStatusToDb(options.status);
    }

    const [data, count] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: { student: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    const meta: PageMeta = { page, pageSize, count };

    return {
      data: transformResponse<Assignment[]>(data as any),
      meta,
    };
  }

  async getContentAssignments(
    options: GetContentAssignmentsRequest
  ): Promise<{ data: Assignment[]; meta: PageMetaDto; totalAssigned: number }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    const where = { contentId: options.contentId };

    const [data, count] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: { student: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    const meta: PageMeta = { page, pageSize, count };

    return {
      data: transformResponse<Assignment[]>(data as any),
      meta,
      totalAssigned: count,
    };
  }

  private mapStatusToDb(status: AssignmentStatus): PrismaAssignmentStatus {
    const map: Record<number, PrismaAssignmentStatus> = {
      [AssignmentStatus.ASSIGNED]: 'ASSIGNED' as PrismaAssignmentStatus,
      [AssignmentStatus.IN_PROGRESS]: 'IN_PROGRESS' as PrismaAssignmentStatus,
      [AssignmentStatus.COMPLETED]: 'COMPLETED' as PrismaAssignmentStatus,
      [AssignmentStatus.OVERDUE]: 'OVERDUE' as PrismaAssignmentStatus,
    };
    return map[status] || ('ASSIGNED' as PrismaAssignmentStatus);
  }
}
