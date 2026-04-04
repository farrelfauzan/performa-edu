import { Teacher, PageMetaDto } from '@performa-edu/libs';
import {
  CreateTeacherRequest,
  CreateTeacherResponse,
  DeleteTeacherRequest,
  DeleteTeacherResponse,
  GetAllTeachersRequest,
  UpdateTeacherRequest,
  UpdateTeacherResponse,
} from '@performa-edu/proto-types/teacher-service';

export interface ITeacherRepository {
  // Define repository methods here
  createTeacher(
    options: CreateTeacherRequest
  ): Promise<CreateTeacherResponse>;
  getAllTeachers(options: GetAllTeachersRequest): Promise<{
    data: Teacher[];
    meta: PageMetaDto;
  }>;
  getTeacherById(id: string): Promise<{
    data: Teacher;
  }>;
  updateTeacher(
    id: string,
    options: UpdateTeacherRequest
  ): Promise<UpdateTeacherResponse>;
  deleteTeacher(
    options: DeleteTeacherRequest
  ): Promise<DeleteTeacherResponse>;
}
