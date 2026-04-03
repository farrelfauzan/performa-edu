import { Injectable, Logger } from '@nestjs/common';
import { ClassRepository } from './repositories/class.repository';
import {
  CreateClassRequest,
  CreateClassResponse,
  DeleteClassRequest,
  DeleteClassResponse,
  GetAllClassesRequest,
  GetAllClassesResponse,
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

@Injectable()
export class ClassService {
  private readonly logger = new Logger(ClassService.name);

  constructor(private readonly classRepository: ClassRepository) {}

  async getAllClasses(
    options: GetAllClassesRequest
  ): Promise<GetAllClassesResponse> {
    const { data, meta } = await this.classRepository.getAllClasses(options);
    return { classes: data, meta };
  }

  async getClassById(id: string): Promise<GetClassByIdResponse> {
    const { data } = await this.classRepository.getClassById(id);
    return { class: data };
  }

  async createClass(options: CreateClassRequest): Promise<CreateClassResponse> {
    return await this.classRepository.createClass(options);
  }

  async updateClass(
    id: string,
    options: UpdateClassRequest
  ): Promise<UpdateClassResponse> {
    return await this.classRepository.updateClass(id, options);
  }

  async deleteClass(options: DeleteClassRequest): Promise<DeleteClassResponse> {
    return await this.classRepository.deleteClass(options);
  }

  // Teacher membership
  async addTeacherToClass(
    options: AddTeacherToClassRequest
  ): Promise<AddTeacherToClassResponse> {
    return await this.classRepository.addTeacherToClass(options);
  }

  async removeTeacherFromClass(
    options: RemoveTeacherFromClassRequest
  ): Promise<RemoveTeacherFromClassResponse> {
    return await this.classRepository.removeTeacherFromClass(options);
  }

  async getClassTeachers(
    options: GetClassTeachersRequest
  ): Promise<GetClassTeachersResponse> {
    return await this.classRepository.getClassTeachers(options);
  }

  // Student membership
  async addStudentToClass(
    options: AddStudentToClassRequest
  ): Promise<AddStudentToClassResponse> {
    return await this.classRepository.addStudentToClass(options);
  }

  async removeStudentFromClass(
    options: RemoveStudentFromClassRequest
  ): Promise<RemoveStudentFromClassResponse> {
    return await this.classRepository.removeStudentFromClass(options);
  }

  async getClassStudents(
    options: GetClassStudentsRequest
  ): Promise<GetClassStudentsResponse> {
    return await this.classRepository.getClassStudents(options);
  }

  async getStudentClasses(
    options: GetStudentClassesRequest
  ): Promise<GetStudentClassesResponse> {
    return await this.classRepository.getStudentClasses(options);
  }
}
