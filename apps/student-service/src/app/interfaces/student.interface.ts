import { PageMetaDto } from '@performa-edu/libs';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  GetAllStudentsRequest,
  Student,
  UpdateStudentRequest,
  UpdateStudentResponse,
  DeleteStudentRequest,
  DeleteStudentResponse,
} from '@performa-edu/proto-types/student-service';

export interface IStudentRepository {
  registerStudent(
    options: RegisterStudentRequest
  ): Promise<RegisterStudentResponse>;
  getAllStudents(options: GetAllStudentsRequest): Promise<{
    data: Student[];
    meta: PageMetaDto;
  }>;
  getStudentById(id: string): Promise<{ data: Student }>;
  getStudentByUserId(userId: string): Promise<{ data: Student }>;
  updateStudent(
    id: string,
    options: UpdateStudentRequest
  ): Promise<UpdateStudentResponse>;
  deleteStudent(options: DeleteStudentRequest): Promise<DeleteStudentResponse>;
}
