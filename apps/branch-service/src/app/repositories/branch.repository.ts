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
  AssignCustomerToBranchRequest,
  AssignCustomerToBranchResponse,
  UnassignCustomerFromBranchRequest,
  UnassignCustomerFromBranchResponse,
  GetBranchCustomersRequest,
  GetBranchCustomersResponse,
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
        _count: { select: { customers: true, students: true } },
      },
    });

    return {
      branch: {
        ...transformResponse(branch),
        customerCount: branch._count.customers,
        studentCount: branch._count.students,
        customers: [],
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
          _count: { select: { customers: true, students: true } },
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
      customerCount: b._count.customers,
      studentCount: b._count.students,
      customers: [],
      students: [],
    }));

    return { data, meta };
  }

  async getBranchById(id: string): Promise<{ data: Branch }> {
    const branch = await this.prisma.branch.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { customers: true, students: true } },
        customers: {
          include: { customer: true },
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
      customerCount: branch._count.customers,
      studentCount: branch._count.students,
      customers: branch.customers.map((bc) => ({
        id: bc.id,
        customerId: bc.customerId,
        fullName: bc.customer.fullName,
        profilePictureUrl: bc.customer.profilePictureUrl || undefined,
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
        _count: { select: { customers: true, students: true } },
      },
    });

    return {
      branch: {
        ...transformResponse(updatedBranch),
        customerCount: updatedBranch._count.customers,
        studentCount: updatedBranch._count.students,
        customers: [],
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

  // --- Customer (Teacher) Membership ---

  async assignCustomerToBranch(
    options: AssignCustomerToBranchRequest
  ): Promise<AssignCustomerToBranchResponse> {
    const existing = await this.prisma.branch.findFirst({
      where: { id: options.branchId, deletedAt: null },
    });

    if (!existing) {
      BranchNotFoundError(options.branchId);
    }

    const result = await this.prisma.branchCustomer.createMany({
      data: options.customerIds.map((customerId) => ({
        branchId: options.branchId,
        customerId,
      })),
      skipDuplicates: true,
    });

    return {
      message: `${result.count} customer(s) assigned to branch`,
      addedCount: result.count,
    };
  }

  async unassignCustomerFromBranch(
    options: UnassignCustomerFromBranchRequest
  ): Promise<UnassignCustomerFromBranchResponse> {
    await this.prisma.branchCustomer.delete({
      where: {
        branchId_customerId: {
          branchId: options.branchId,
          customerId: options.customerId,
        },
      },
    });

    return { message: 'Customer removed from branch' };
  }

  async getBranchCustomers(
    options: GetBranchCustomersRequest
  ): Promise<GetBranchCustomersResponse> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      branchId: options.branchId,
    };

    if (options.search) {
      where.customer = {
        fullName: { contains: options.search, mode: 'insensitive' },
      };
    }

    const [customers, count] = await Promise.all([
      this.prisma.branchCustomer.findMany({
        where,
        skip,
        take: pageSize,
        include: { customer: true },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.branchCustomer.count({ where }),
    ]);

    return {
      customers: customers.map((bc) => ({
        id: bc.id,
        customerId: bc.customerId,
        fullName: bc.customer.fullName,
        profilePictureUrl: bc.customer.profilePictureUrl || undefined,
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
