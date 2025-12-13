import { Injectable } from '@nestjs/common';
import { IStudentRepository } from '../interfaces/student.repositroy.interface';
import {
  DynamicQueryBuilder,
  GetAllStudentsDto,
  PrismaService,
  UpdateStudentDto,
} from '@performa-edu/libs';
import { PageMetaDto } from 'libs/src/common';
import { Student } from '@prisma/client';

@Injectable()
export class StudentRepository implements IStudentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder
  ) {}

  async findAllStudents(
    options: GetAllStudentsDto
  ): Promise<{ data: Student[]; meta: PageMetaDto }> {
    try {
      const searchFields = [
        'firstName',
        'lastName',
        'address',
        'studentNumber',
        'phoneNumber',
      ];

      const students = await this.dynamicQueryBuilder.buildDynamicQuery(
        'Student',
        {
          ...options,
          where: {
            // Add soft delete filter - only get non-deleted students
            deletedAt: null,
            ...(options.search && {
              OR: searchFields.map((field) => ({
                [field]: {
                  contains: options.search,
                  mode: 'insensitive',
                },
              })),
            }),
          },
        }
      );

      const meta = {
        page: options.page || 1,
        pageSize: options.pageSize || 10,
        count: students.count,
      };

      return { data: students.data, meta };
    } catch (error) {
      throw new Error(`Failed to retrieve students: ${error.message}`);
    }
  }

  async findStudentById(id: string): Promise<{ data: Student }> {
    try {
      const student = await this.prisma.student.findFirst({
        where: {
          id,
          deletedAt: null, // Only get non-deleted students
        },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      return { data: student };
    } catch (error) {
      throw new Error(`Failed to retrieve student: ${error.message}`);
    }
  }

  async findStudentsByUserId(userId: string): Promise<{ data: Student }> {
    try {
      const student = await this.prisma.student.findFirst({
        where: {
          userId,
          deletedAt: null, // Only get non-deleted students
        },
      });

      if (!student) {
        throw new Error('Student not found');
      }

      return { data: student };
    } catch (error) {
      throw new Error(`Failed to retrieve student: ${error.message}`);
    }
  }

  async updateStudentById(
    options: UpdateStudentDto
  ): Promise<{ data: Student }> {
    try {
      const { id, ...updateData } = options;
      const student = await this.prisma.student.update({
        where: { id },
        data: updateData,
      });

      await this.prisma.user.update({
        where: { id: student.userId },
        data: {
          ...(options.email && { email: options.email }),
          ...(options.username && { username: options.username }),
        },
      });

      return { data: student };
    } catch (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }
  }

  async deleteStudentById(id: string): Promise<{ message: string }> {
    try {
      // Soft delete - set deletedAt timestamp instead of actually deleting
      // await this.prisma.student.update({
      //   where: { id },
      //   data: {
      //     deletedAt: new Date(),
      //   },
      // });

      await this.prisma.softDelete<Student>(this.prisma.student, { id });

      return { message: 'Student deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }

  // Optional: Add method to restore soft-deleted students
  async restoreStudentById(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.student.update({
        where: { id },
        data: {
          deletedAt: null,
        },
      });

      return { message: 'Student restored successfully' };
    } catch (error) {
      throw new Error(`Failed to restore student: ${error.message}`);
    }
  }
}
