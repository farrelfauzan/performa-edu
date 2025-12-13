import { PageMetaDto } from 'libs/src/common';
import { Student } from '@prisma/client';
import { GetAllStudentsDto, UpdateStudentDto } from '@performa-edu/libs';

export interface IStudentRepository {
  findAllStudents(options: GetAllStudentsDto): Promise<{
    data: Student[];
    meta: PageMetaDto;
  }>;
  findStudentById(id: string): Promise<{
    data: Student;
  }>;
  findStudentsByUserId(userId: string): Promise<{
    data: Student;
  }>;
  updateStudentById(options: UpdateStudentDto): Promise<{
    data: Student;
  }>;
  deleteStudentById(id: string): Promise<{
    message: string;
  }>;
}
