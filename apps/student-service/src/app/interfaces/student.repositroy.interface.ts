import { PageMetaDto } from 'libs/src/common';
import { GetAllStudentsDto } from '../dtos/get-all-students.dto';
import { Student } from '@prisma/client';
import { UpdateStudentDto } from '../dtos/update-student.dto';

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
