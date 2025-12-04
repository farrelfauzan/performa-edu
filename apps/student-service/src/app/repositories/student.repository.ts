import { Injectable } from '@nestjs/common';
import { IStudentRepository } from '../interfaces/student.repositroy.interface';
import { DynamicQueryBuilder, PrismaService } from '@performa-edu/libs';
import { PageMetaDto } from 'libs/src/common';
import { GetAllStudentsDto } from '../dtos/get-all-students.dto';
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
      const student = await this.prisma.student.findUnique({
        where: { id },
      });

      return { data: student };
    } catch (error) {
      throw new Error(`Failed to retrieve student: ${error.message}`);
    }
  }

  async findStudentsByUserId(userId: string): Promise<{ data: Student }> {
    try {
      const student = await this.prisma.student.findFirst({
        where: { userId },
      });

      return { data: student };
    } catch (error) {
      throw new Error(`Failed to retrieve student: ${error.message}`);
    }
  }

  async updateStudentById(
    options: Partial<Student> & { id: string }
  ): Promise<{ data: Student }> {
    try {
      const { id, ...updateData } = options;
      const student = await this.prisma.student.update({
        where: { id },
        data: updateData,
      });

      return { data: student };
    } catch (error) {
      throw new Error(`Failed to update student: ${error.message}`);
    }
  }

  async deleteStudentById(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.student.delete({
        where: { id },
      });

      return { message: 'Student deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete student: ${error.message}`);
    }
  }
}
