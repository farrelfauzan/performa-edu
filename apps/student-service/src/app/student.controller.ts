import { Controller, Get, Logger } from '@nestjs/common';
import { StudentService } from './student.service';
import {
  DeleteStudentByIdRequest,
  DeleteStudentByIdResponse,
  GetAllStudentsRequest,
  GetAllStudentsResponse,
  GetStudentByIdRequest,
  GetStudentByUserIdRequest,
  StudentResponse,
  StudentServiceController,
  StudentServiceControllerMethods,
} from '@performa-edu/proto-types/student-service';
import { Observable } from 'rxjs';

@Controller()
@StudentServiceControllerMethods()
export class StudentController implements StudentServiceController {
  constructor(private readonly studentService: StudentService) {}

  async findAllStudents(
    request: GetAllStudentsRequest
  ): Promise<GetAllStudentsResponse> {
    const result = await this.studentService.findAllStudents(request);
    return {
      students: result.data.map((student) => ({
        ...student,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
        deletedAt: student.deletedAt?.toISOString(),
      })),
      meta: result.meta,
    };
  }

  deleteStudentById(
    request: DeleteStudentByIdRequest
  ):
    | Promise<DeleteStudentByIdResponse>
    | Observable<DeleteStudentByIdResponse>
    | DeleteStudentByIdResponse {
    throw new Error('Method not implemented.');
  }

  findStudentById(
    request: GetStudentByIdRequest
  ): Promise<StudentResponse> | Observable<StudentResponse> | StudentResponse {
    throw new Error('Method not implemented.');
  }

  findStudentByUserId(
    request: GetStudentByUserIdRequest
  ): Promise<StudentResponse> | Observable<StudentResponse> | StudentResponse {
    throw new Error('Method not implemented.');
  }

  updateStudentById(
    request: any
  ): Promise<StudentResponse> | Observable<StudentResponse> | StudentResponse {
    throw new Error('Method not implemented.');
  }
}
