import { PageMetaDto } from '@performa-edu/libs';
import {
  CreateClassRequest,
  CreateClassResponse,
  DeleteClassRequest,
  DeleteClassResponse,
  GetAllClassesRequest,
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
  Class,
} from '@performa-edu/proto-types/class-service';

export interface IClassRepository {
  createClass(options: CreateClassRequest): Promise<CreateClassResponse>;
  getAllClasses(options: GetAllClassesRequest): Promise<{
    data: Class[];
    meta: PageMetaDto;
  }>;
  getClassById(id: string): Promise<{ data: Class }>;
  updateClass(id: string, options: UpdateClassRequest): Promise<UpdateClassResponse>;
  deleteClass(options: DeleteClassRequest): Promise<DeleteClassResponse>;
  addTeacherToClass(options: AddTeacherToClassRequest): Promise<AddTeacherToClassResponse>;
  removeTeacherFromClass(options: RemoveTeacherFromClassRequest): Promise<RemoveTeacherFromClassResponse>;
  getClassTeachers(options: GetClassTeachersRequest): Promise<GetClassTeachersResponse>;
  addStudentToClass(options: AddStudentToClassRequest): Promise<AddStudentToClassResponse>;
  removeStudentFromClass(options: RemoveStudentFromClassRequest): Promise<RemoveStudentFromClassResponse>;
  getClassStudents(options: GetClassStudentsRequest): Promise<GetClassStudentsResponse>;
  getStudentClasses(options: GetStudentClassesRequest): Promise<GetStudentClassesResponse>;
}
