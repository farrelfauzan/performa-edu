import { Injectable } from '@nestjs/common';
import { IClassRepository } from '../interfaces/class-repository.interface';
import {
  DynamicQueryBuilder,
  generateUniqueId,
  PageMeta,
  PageMetaDto,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import {
  CreateClassRequest,
  CreateClassResponse,
  DeleteClassRequest,
  DeleteClassResponse,
  GetAllClassesRequest,
  UpdateClassRequest,
  UpdateClassResponse,
  AddTeacherToClassRequest,
  AddTeacherToClassResponse,
  RemoveTeacherFromClassRequest,
  RemoveTeacherFromClassResponse,
  GetClassTeachersRequest,
  GetClassTeachersResponse,
  AddStudentToClassRequest,
  AddStudentToClassResponse,
  RemoveStudentFromClassRequest,
  RemoveStudentFromClassResponse,
  GetClassStudentsRequest,
  GetClassStudentsResponse,
  GetStudentClassesRequest,
  GetStudentClassesResponse,
  Class,
  GetAllClassesResponse,
} from '@performa-edu/proto-types/class-service';
import { ClassNotFoundError } from '../error/class.error';

@Injectable()
export class ClassRepository implements IClassRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder
  ) {}

  async createClass(options: CreateClassRequest): Promise<CreateClassResponse> {
    const classEntity = await this.prisma.class.create({
      data: {
        uniqueId: generateUniqueId('CLS'),
        createdBy: options.createdBy,
        name: options.name,
        ...(options.description ? { description: options.description } : {}),
      },
      include: {
        _count: { select: { teachers: true, students: true } },
      },
    });

    return {
      class: {
        ...transformResponse(classEntity),
        teacherCount: classEntity._count.teachers,
        studentCount: classEntity._count.students,
        teachers: [],
        students: [],
      },
    };
  }

  async getAllClasses(options: GetAllClassesRequest): Promise<{
    data: GetAllClassesResponse['classes'];
    meta: GetAllClassesResponse['meta'];
  }> {
    const classes = await this.dynamicQueryBuilder.buildDynamicQuery('Class', {
      ...options,
      where: {
        ...(options.search && {
          name: { contains: options.search, mode: 'insensitive' },
        }),
      },
      include: {
        _count: { select: { teachers: true, students: true } },
      },
    });

    const meta: PageMeta = {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      count: classes.count,
    };

    const data = classes.data.map((c) => ({
      ...transformResponse(c),
      teacherCount: c._count.teachers,
      studentCount: c._count.students,
      teachers: [],
      students: [],
    }));

    return {
      data,
      meta,
    };

    // const searchFields = ['name'];

    // const where: Record<string, unknown> = {
    //   deletedAt: null,
    //   OR: searchFields.map((field) => ({
    //     [field]: {
    //       contains: options.search || '',
    //       mode: 'insensitive',
    //     },
    //   })),
    // };

    // if (options.teacherId) {
    //   where.teachers = {
    //     some: { customerId: options.teacherId },
    //   };
    // }

    // const page = options.page || 1;
    // const pageSize = options.pageSize || 10;
    // const skip = (page - 1) * pageSize;

    // const [classes, count] = await Promise.all([
    //   this.prisma.class.findMany({
    //     where,
    //     skip,
    //     take: pageSize,
    //     orderBy: {
    //       [options.sortBy || 'createdAt']: options.order === 1 ? 'desc' : 'asc',
    //     },
    //     include: {
    //       _count: { select: { teachers: true, students: true } },
    //     },
    //   }),
    //   this.prisma.class.count({ where }),
    // ]);

    // const data = classes.map((c) => ({
    //   ...transformResponse(c),
    //   teacherCount: c._count.teachers,
    //   studentCount: c._count.students,
    //   teachers: [],
    //   students: [],
    // }));

    // const meta: PageMeta = {
    //   page,
    //   pageSize,
    //   count,
    // };

    // return { data, meta };
  }

  async getClassById(id: string): Promise<{ data: Class }> {
    const classEntity = await this.prisma.class.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { teachers: true, students: true } },
        teachers: {
          include: { customer: true },
          orderBy: { joinedAt: 'asc' },
        },
        students: {
          include: { student: true },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!classEntity) {
      ClassNotFoundError(id);
    }

    const data: Class = {
      ...transformResponse(classEntity),
      teacherCount: classEntity._count.teachers,
      studentCount: classEntity._count.students,
      teachers: classEntity.teachers.map((t) => ({
        id: t.id,
        customerId: t.customerId,
        fullName: t.customer.fullName,
        profilePictureUrl: t.customer.profilePictureUrl || undefined,
        joinedAt: t.joinedAt.toISOString(),
      })),
      students: classEntity.students.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        fullName: s.student.fullName,
        profilePictureUrl: s.student.profilePictureUrl || undefined,
        joinedAt: s.joinedAt.toISOString(),
      })),
    };

    return { data };
  }

  async updateClass(
    id: string,
    options: UpdateClassRequest
  ): Promise<UpdateClassResponse> {
    const existing = await this.prisma.class.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      ClassNotFoundError(id);
    }

    const updatedClass = await this.prisma.class.update({
      where: { id },
      data: {
        ...(options.name ? { name: options.name } : {}),
        ...(options.description !== undefined
          ? { description: options.description }
          : {}),
        ...(options.active ? { active: options.active as any } : {}),
      },
      include: {
        _count: { select: { teachers: true, students: true } },
      },
    });

    return {
      class: {
        ...transformResponse(updatedClass),
        teacherCount: updatedClass._count.teachers,
        studentCount: updatedClass._count.students,
        teachers: [],
        students: [],
      },
    };
  }

  async deleteClass(options: DeleteClassRequest): Promise<DeleteClassResponse> {
    const existing = await this.prisma.class.findFirst({
      where: { id: options.id, deletedAt: null },
    });

    if (!existing) {
      ClassNotFoundError(options.id);
    }

    await this.prisma.class.update({
      where: { id: options.id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Class deleted successfully' };
  }

  // --- Teacher Membership ---

  async addTeacherToClass(
    options: AddTeacherToClassRequest
  ): Promise<AddTeacherToClassResponse> {
    const existing = await this.prisma.class.findFirst({
      where: { id: options.classId, deletedAt: null },
    });

    if (!existing) {
      ClassNotFoundError(options.classId);
    }

    const result = await this.prisma.classTeacher.createMany({
      data: options.customerIds.map((customerId) => ({
        classId: options.classId,
        customerId,
      })),
      skipDuplicates: true,
    });

    return {
      message: `${result.count} teacher(s) added to class`,
      addedCount: result.count,
    };
  }

  async removeTeacherFromClass(
    options: RemoveTeacherFromClassRequest
  ): Promise<RemoveTeacherFromClassResponse> {
    await this.prisma.classTeacher.delete({
      where: {
        classId_customerId: {
          classId: options.classId,
          customerId: options.customerId,
        },
      },
    });

    return { message: 'Teacher removed from class' };
  }

  async getClassTeachers(
    options: GetClassTeachersRequest
  ): Promise<GetClassTeachersResponse> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      classId: options.classId,
    };

    if (options.search) {
      where.customer = {
        fullName: { contains: options.search, mode: 'insensitive' },
      };
    }

    const [teachers, count] = await Promise.all([
      this.prisma.classTeacher.findMany({
        where,
        skip,
        take: pageSize,
        include: { customer: true },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.classTeacher.count({ where }),
    ]);

    return {
      teachers: teachers.map((t) => ({
        id: t.id,
        customerId: t.customerId,
        fullName: t.customer.fullName,
        profilePictureUrl: t.customer.profilePictureUrl || undefined,
        joinedAt: t.joinedAt.toISOString(),
      })),
      meta: { page, pageSize, count },
    };
  }

  // --- Student Membership ---

  async addStudentToClass(
    options: AddStudentToClassRequest
  ): Promise<AddStudentToClassResponse> {
    const existing = await this.prisma.class.findFirst({
      where: { id: options.classId, deletedAt: null },
    });

    if (!existing) {
      ClassNotFoundError(options.classId);
    }

    const result = await this.prisma.classStudent.createMany({
      data: options.studentIds.map((studentId) => ({
        classId: options.classId,
        studentId,
      })),
      skipDuplicates: true,
    });

    return {
      message: `${result.count} student(s) added to class`,
      addedCount: result.count,
    };
  }

  async removeStudentFromClass(
    options: RemoveStudentFromClassRequest
  ): Promise<RemoveStudentFromClassResponse> {
    await this.prisma.classStudent.delete({
      where: {
        classId_studentId: {
          classId: options.classId,
          studentId: options.studentId,
        },
      },
    });

    return { message: 'Student removed from class' };
  }

  async getClassStudents(
    options: GetClassStudentsRequest
  ): Promise<GetClassStudentsResponse> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {
      classId: options.classId,
    };

    if (options.search) {
      where.student = {
        fullName: { contains: options.search, mode: 'insensitive' },
      };
    }

    const [students, count] = await Promise.all([
      this.prisma.classStudent.findMany({
        where,
        skip,
        take: pageSize,
        include: { student: true },
        orderBy: { joinedAt: 'asc' },
      }),
      this.prisma.classStudent.count({ where }),
    ]);

    return {
      students: students.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        fullName: s.student.fullName,
        profilePictureUrl: s.student.profilePictureUrl || undefined,
        joinedAt: s.joinedAt.toISOString(),
      })),
      meta: { page, pageSize, count },
    };
  }

  async getStudentClasses(
    options: GetStudentClassesRequest
  ): Promise<GetStudentClassesResponse> {
    const classStudents = await this.prisma.classStudent.findMany({
      where: { studentId: options.studentId },
      include: {
        class: {
          include: {
            _count: { select: { teachers: true, students: true } },
          },
        },
      },
    });

    return {
      classes: classStudents
        .filter((cs) => cs.class.deletedAt === null)
        .map((cs) => ({
          ...transformResponse(cs.class),
          teacherCount: cs.class._count.teachers,
          studentCount: cs.class._count.students,
          teachers: [],
          students: [],
        })),
    };
  }
}
