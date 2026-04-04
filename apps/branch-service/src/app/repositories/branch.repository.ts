import { Injectable } from '@nestjs/common';
import { IBranchRepository } from '../interfaces/branch-repository.interface';
import {
  DynamicQueryBuilder,
  PageMeta,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import {
  CreateBranchRequest,
  CreateBranchResponse,
  DeleteBranchRequest,
  DeleteBranchResponse,
  GetAllBranchesRequest,
  UpdateBranchRequest,
  UpdateBranchResponse,
  AssignTeacherToBranchRequest,
  AssignTeacherToBranchResponse,
  UnassignTeacherFromBranchRequest,
  UnassignTeacherFromBranchResponse,
  GetBranchTeachersRequest,
  GetBranchTeachersResponse,
  AssignStudentToBranchRequest,
  AssignStudentToBranchResponse,
  UnassignStudentFromBranchRequest,
  UnassignStudentFromBranchResponse,
  GetBranchStudentsRequest,
  GetBranchStudentsResponse,
  Branch,
  GetAllBranchesResponse,
} from '@performa-edu/proto-types/branch-service';
import { BranchNotFoundError } from '../error/branch.error';

@Injectable()
export class BranchRepository implements IBranchRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder
  ) {}

  async createBranch(
    options: CreateBranchRequest
  ): Promise<CreateBranchResponse> {
    const branch = await this.prisma.branch.create({
      data: {
        name: options.name,
        adminId: options.adminId,
        adminName: options.adminName,
        ...(options.address ? { address: options.address } : {}),
        ...(options.phone ? { phone: options.phone } : {}),
      },
      include: {
        _count: { select: { teachers: true, students: true } },
      },
    });

    return {
      branch: {
        ...transformResponse(branch),
        teacherCount: branch._count.teachers,
        studentCount: branch._count.students,
        teachers: [],
        students: [],
      },
    };
  }

  async getAllBranches(options: GetAllBranchesRequest): Promise<{
    data: GetAllBranchesResponse['branches'];
    meta: GetAllBranchesResponse['meta'];
  }> {
    const branches = await this.dynamicQueryBuilder.buildDynamicQuery(
      'Branch',
      {
        ...options,
        where: {
          ...(options.search && {
            name: { contains: options.search, mode: 'insensitive' },
          }),
        },
        include: {
          _count: { select: { teachers: true, students: true } },
        },
      }
    );

    const meta: PageMeta = {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      count: branches.count,
    };

    const data = branches.data.map((b) => ({
      ...transformResponse(b),
      teacherCount: b._count.teachers,
      studentCount: b._count.students,
      teachers: [],
      students: [],
    }));

    return { data, meta };
  }

  async getBranchById(id: string): Promise<{ data: Branch }> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { teachers: true, students: true } },
        teachers: {
          include: { teacher: true },
          orderBy: { joinedAt: 'asc' },
        },
        students: true,
      },
    });

    if (!branch) {
      BranchNotFoundError(id);
    }

    const data: Branch = {
      ...transformResponse(branch),
      teacherCount: branch._count.teachers,
      studentCount: branch._count.students,
      teachers: branch.teachers.map((bc) => ({
        id: bc.id,
        teacherId: bc.teacherId,
        fullName: bc.teacher.fullName,
        profilePictureUrl: bc.teacher.profilePictureUrl || undefined,
        joinedAt: bc.joinedAt.toISOString(),
      })),
      students: branch.students.map((s) => ({
        id: s.id,
        studentId: s.id,
        fullName: s.fullName,
        profilePictureUrl: s.profilePictureUrl || undefined,
      })),
    };

    return { data };
  }

  async updateBranch(
    id: string,
    options: UpdateBranchRequest
  ): Promise<UpdateBranchResponse> {
    const existing = await this.prisma.branch.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      BranchNotFoundError(id);
    }

    const updatedBranch = await this.prisma.branch.update({
      where: { id },
      data: {
        ...(options.name ? { name: options.name } : {}),
        ...(options.address !== undefined ? { address: options.address } : {}),
        ...(options.phone !== undefined ? { phone: options.phone } : {}),
        ...(options.adminId ? { adminId: options.adminId } : {}),
        ...(options.adminName ? { adminName: options.adminName } : {}),
      },
      include: {
        _count: { select: { teachers: true, students: true } },
      },
    });

    return {
      branch: {
        ...transformResponse(updatedBranch),
        teacherCount: updatedBranch._count.teachers,
        studentCount: updatedBranch._count.students,
        teachers: [],
        students: [],
      },
    };
  }

  async deleteBranch(
    options: DeleteBranchRequest
  ): Promise<DeleteBranchResponse> {
    const existing = await this.prisma.branch.findFirst({
      where: { id: options.id, deletedAt: null },
    });

    if (!existing) {
      BranchNotFoundError(options.id);
    }

    await this.prisma.branch.update({
      where: { id: options.id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Branch deleted successfully' };
  }

  // --- Teacher Membership ---

  async assignTeacherToBranch(
    options: AssignTeacherToBranchRequest
  ): Promise<AssignTeacherToBranchResponse> {
    const existing = await this.prisma.branch.findFirst({
      where: { id: options.branchId, deletedAt: null },
    });

    if (!existing) {
      BranchNotFoundError(options.branchId);
    }

    const result = await this.prisma.branchTeacher.createMany({
      data: options.teacherIds.map((teacherId) => ({
        branchId: options.branchId,
        teacherId,
      })),
      skipDuplicates: true,
    });

    return {
      message: `${result.count} teacher(s) assigned to branch`,
      addedCount: result.count,
    };
  }

  async unassignTeacherFromBranch(
    options: UnassignTeacherFromBranchRequest
  ): Promise<UnassignTeacherFromBranchResponse> {
    await this.prisma.branchTeacher.delete({
      where: {
        branchId_teacherId: {
          branchId: options.branchId,
          teacherId: options.teacherId,
        },
      },
    });

    return { message: 'Teacher removed from branch' };
  }

  async getBranchTeachers(
    options: GetBranchTeachersRequest
  ): Promise<GetBranchTeachersResponse> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      branchId: options.branchId,
    };

    if (options.search) {
      where.teacher = {
        fullName: { contains: options.search, mode: 'insensitive' },
      };
    }

    const [teachers, count] = await Promise.all([
      this.prisma.branchTeacher.findMany({
        where,
        skip,
        take: pageSize,
        include: { teacher: true },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.branchTeacher.count({ where }),
    ]);

    return {
      teachers: teachers.map((bc) => ({
        id: bc.id,
        teacherId: bc.teacherId,
        fullName: bc.teacher.fullName,
        profilePictureUrl: bc.teacher.profilePictureUrl || undefined,
        joinedAt: bc.joinedAt.toISOString(),
      })),
      meta: { page, pageSize, count },
    };
  }

  // --- Student Membership ---

  async assignStudentToBranch(
    options: AssignStudentToBranchRequest
  ): Promise<AssignStudentToBranchResponse> {
    const existing = await this.prisma.branch.findFirst({
      where: { id: options.branchId, deletedAt: null },
    });

    if (!existing) {
      BranchNotFoundError(options.branchId);
    }

    const result = await this.prisma.student.updateMany({
      where: {
        id: { in: options.studentIds },
      },
      data: {
        branchId: options.branchId,
      },
    });

    return {
      message: `${result.count} student(s) assigned to branch`,
      addedCount: result.count,
    };
  }

  async unassignStudentFromBranch(
    options: UnassignStudentFromBranchRequest
  ): Promise<UnassignStudentFromBranchResponse> {
    await this.prisma.student.update({
      where: { id: options.studentId },
      data: { branchId: null },
    });

    return { message: 'Student removed from branch' };
  }

  async getBranchStudents(
    options: GetBranchStudentsRequest
  ): Promise<GetBranchStudentsResponse> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      branchId: options.branchId,
    };

    if (options.search) {
      where.fullName = { contains: options.search, mode: 'insensitive' };
    }

    const [students, count] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      students: students.map((s) => ({
        id: s.id,
        studentId: s.id,
        fullName: s.fullName,
        profilePictureUrl: s.profilePictureUrl || undefined,
      })),
      meta: { page, pageSize, count },
    };
  }
}
