import { Controller } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import {
  CreateTeacherRequest,
  CreateTeacherResponse,
  TeacherServiceController,
  TeacherServiceControllerMethods,
  DeleteTeacherRequest,
  DeleteTeacherResponse,
  GetAllTeachersRequest,
  GetAllTeachersResponse,
  GetTeacherByIdRequest,
  GetTeacherByIdResponse,
  UpdateTeacherRequest,
  UpdateTeacherResponse,
} from '@performa-edu/proto-types/teacher-service';

@Controller()
@TeacherServiceControllerMethods()
export class TeacherController implements TeacherServiceController {
  constructor(private readonly teacherService: TeacherService) {}

  async getAllTeachers(
    options: GetAllTeachersRequest
  ): Promise<GetAllTeachersResponse> {
    const result = await this.teacherService.getAllTeachers(options);
    return result;
  }

  async getTeacherById(
    options: GetTeacherByIdRequest
  ): Promise<GetTeacherByIdResponse> {
    const result = await this.teacherService.getTeacherById(options.id);
    return result;
  }

  async createTeacher(
    options: CreateTeacherRequest
  ): Promise<CreateTeacherResponse> {
    const result = await this.teacherService.createTeacher(options);
    return result;
  }

  async updateTeacher(
    options: UpdateTeacherRequest
  ): Promise<UpdateTeacherResponse> {
    const result = await this.teacherService.updateTeacher(
      options.id,
      options
    );
    return result;
  }

  async deleteTeacher(
    options: DeleteTeacherRequest
  ): Promise<DeleteTeacherResponse> {
    const result = await this.teacherService.deleteTeacher(options);
    return result;
  }
}
