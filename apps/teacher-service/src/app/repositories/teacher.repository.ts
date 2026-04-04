import { Injectable } from '@nestjs/common';
import { ITeacherRepository } from '../interfaces/teacher-interface';
import {
  Teacher,
  DynamicQueryBuilder,
  generateUniqueId,
  PageMeta,
  PageMetaDto,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import {
  CreateTeacherRequest,
  CreateTeacherResponse,
  DeleteTeacherRequest,
  DeleteTeacherResponse,
  GetAllTeachersRequest,
  UpdateTeacherRequest,
  UpdateTeacherResponse,
} from '@performa-edu/proto-types/teacher-service';
import { TeacherNotFoundError } from '../error/teacher.error';

@Injectable()
export class TeacherRepository implements ITeacherRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder
  ) {}

  async createTeacher(
    options: CreateTeacherRequest
  ): Promise<CreateTeacherResponse> {
    const teacher = await this.prisma.teacher.create({
      data: {
        userId: options.userId,
        uniqueId: generateUniqueId('TCHR'),
        fullName: options.fullName,
        phoneNumber: options.phoneNumber,
        ...(options.dateOfBirth
          ? { dateOfBirth: new Date(options.dateOfBirth) }
          : {}),
      },
    });

    return {
      teacher: transformResponse<Teacher>(teacher),
    };
  }

  async getAllTeachers(
    options: GetAllTeachersRequest
  ): Promise<{ data: Teacher[]; meta: PageMetaDto }> {
    const searchFiled = ['fullName', 'phoneNumber'];

    const teachers = await this.dynamicQueryBuilder.buildDynamicQuery(
      'Teacher',
      {
        ...options,
        where: {
          OR: searchFiled.map((field) => ({
            [field]: {
              contains: options.search || '',
              mode: 'insensitive',
            },
          })),
        },
      }
    );

    const meta: PageMeta = {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      count: teachers.count,
    };

    return {
      data: transformResponse<Teacher[]>(teachers.data),
      meta,
    };
  }

  async getTeacherById(id: string): Promise<{ data: Teacher }> {
    const teacher = await this.prisma.findFirstActive<Teacher>(
      this.prisma.teacher,
      {
        where: { id },
      }
    );

    if (!teacher) {
      TeacherNotFoundError(id);
    }

    return { data: transformResponse<Teacher>(teacher) };
  }

  async updateTeacher(
    id: string,
    options: UpdateTeacherRequest
  ): Promise<UpdateTeacherResponse> {
    const teacher = this.prisma.findFirstActive<Teacher>(
      this.prisma.teacher,
      {
        where: { id },
      }
    );

    if (!teacher) {
      TeacherNotFoundError(id);
    }

    const updatedTeacher = await this.prisma.teacher.update({
      where: { id },
      data: {
        fullName: options.fullName,
        phoneNumber: options.phoneNumber,
        dateOfBirth: options.dateOfBirth,
      },
    });

    return {
      teacher: transformResponse<Teacher>(updatedTeacher),
    };
  }

  async deleteTeacher(
    options: DeleteTeacherRequest
  ): Promise<DeleteTeacherResponse> {
    const teacher = await this.prisma.findFirstActive<Teacher>(
      this.prisma.teacher,
      {
        where: { id: options.id },
      }
    );

    if (!teacher) {
      TeacherNotFoundError(options.id);
    }

    await this.prisma.softDelete<Teacher>(this.prisma.teacher, {
      id: options.id,
    });

    return {
      message: 'Teacher deleted successfully',
    };
  }
}
