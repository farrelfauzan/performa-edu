import { Controller } from '@nestjs/common';
import { ClassService } from './class.service';
import {
  CreateClassRequest,
  CreateClassResponse,
  ClassServiceController,
  ClassServiceControllerMethods,
  DeleteClassRequest,
  DeleteClassResponse,
  GetAllClassesRequest,
  GetAllClassesResponse,
  GetClassByIdRequest,
  GetClassByIdResponse,
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
} from '@performa-edu/proto-types/class-service';

@Controller()
@ClassServiceControllerMethods()
export class ClassController implements ClassServiceController {
  constructor(private readonly classService: ClassService) {}

  async createClass(options: CreateClassRequest): Promise<CreateClassResponse> {
    return await this.classService.createClass(options);
  }

  async getClassById(
    options: GetClassByIdRequest
  ): Promise<GetClassByIdResponse> {
    return await this.classService.getClassById(options.id);
  }

  async updateClass(options: UpdateClassRequest): Promise<UpdateClassResponse> {
    return await this.classService.updateClass(options.id, options);
  }

  async deleteClass(options: DeleteClassRequest): Promise<DeleteClassResponse> {
    return await this.classService.deleteClass(options);
  }

  async getAllClasses(
    options: GetAllClassesRequest
  ): Promise<GetAllClassesResponse> {
    return await this.classService.getAllClasses(options);
  }

  async addTeacherToClass(
    options: AddTeacherToClassRequest
  ): Promise<AddTeacherToClassResponse> {
    return await this.classService.addTeacherToClass(options);
  }

  async removeTeacherFromClass(
    options: RemoveTeacherFromClassRequest
  ): Promise<RemoveTeacherFromClassResponse> {
    return await this.classService.removeTeacherFromClass(options);
  }

  async getClassTeachers(
    options: GetClassTeachersRequest
  ): Promise<GetClassTeachersResponse> {
    return await this.classService.getClassTeachers(options);
  }

  async addStudentToClass(
    options: AddStudentToClassRequest
  ): Promise<AddStudentToClassResponse> {
    return await this.classService.addStudentToClass(options);
  }

  async removeStudentFromClass(
    options: RemoveStudentFromClassRequest
  ): Promise<RemoveStudentFromClassResponse> {
    return await this.classService.removeStudentFromClass(options);
  }

  async getClassStudents(
    options: GetClassStudentsRequest
  ): Promise<GetClassStudentsResponse> {
    return await this.classService.getClassStudents(options);
  }

  async getStudentClasses(
    options: GetStudentClassesRequest
  ): Promise<GetStudentClassesResponse> {
    return await this.classService.getStudentClasses(options);
  }
}
