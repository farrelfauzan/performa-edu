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
  UpdateStudentByIdRequest,
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
      data: result.data.map((student) => ({
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
    return this.studentService.deleteStudentById(request.id);
  }

  async findStudentById(
    request: GetStudentByIdRequest
  ): Promise<StudentResponse> {
    const result = await this.studentService.findStudentById(request.id);
    return {
      ...result.data,
      createdAt: result.data.createdAt.toISOString(),
      updatedAt: result.data.updatedAt.toISOString(),
      deletedAt: result.data.deletedAt?.toISOString(),
    };
  }

  async findStudentByUserId(
    request: GetStudentByUserIdRequest
  ): Promise<StudentResponse> {
    const result = await this.studentService.findStudentByUserId(
      request.userId
    );
    return {
      ...result.data,
      createdAt: result.data.createdAt.toISOString(),
      updatedAt: result.data.updatedAt.toISOString(),
      deletedAt: result.data.deletedAt?.toISOString(),
    };
  }

  async updateStudentById(
    request: UpdateStudentByIdRequest
  ): Promise<StudentResponse> {
    const result = await this.studentService.updateStudentById(request);
    return {
      ...result.data,
      createdAt: result.data.createdAt.toISOString(),
      updatedAt: result.data.updatedAt.toISOString(),
      deletedAt: result.data.deletedAt?.toISOString(),
    };
  }
}
