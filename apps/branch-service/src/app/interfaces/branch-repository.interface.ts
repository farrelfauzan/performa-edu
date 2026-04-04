import { PageMetaDto } from '@performa-edu/libs';
import {
  CreateBranchRequest,
  CreateBranchResponse,
  DeleteBranchRequest,
  DeleteBranchResponse,
  GetAllBranchesRequest,
  UpdateBranchRequest,
  UpdateBranchResponse,
  AssignTeacherToBranchRequest,
  AssignTeacherToBranchResponse,
  UnassignTeacherFromBranchRequest,
  UnassignTeacherFromBranchResponse,
  GetBranchTeachersRequest,
  GetBranchTeachersResponse,
  AssignStudentToBranchRequest,
  AssignStudentToBranchResponse,
  UnassignStudentFromBranchRequest,
  UnassignStudentFromBranchResponse,
  GetBranchStudentsRequest,
  GetBranchStudentsResponse,
  Branch,
} from '@performa-edu/proto-types/branch-service';

export interface IBranchRepository {
  createBranch(options: CreateBranchRequest): Promise<CreateBranchResponse>;
  getAllBranches(options: GetAllBranchesRequest): Promise<{
    data: Branch[];
    meta: PageMetaDto;
  }>;
  getBranchById(id: string): Promise<{ data: Branch }>;
  updateBranch(
    id: string,
    options: UpdateBranchRequest
  ): Promise<UpdateBranchResponse>;
  deleteBranch(options: DeleteBranchRequest): Promise<DeleteBranchResponse>;
  assignTeacherToBranch(
    options: AssignTeacherToBranchRequest
  ): Promise<AssignTeacherToBranchResponse>;
  unassignTeacherFromBranch(
    options: UnassignTeacherFromBranchRequest
  ): Promise<UnassignTeacherFromBranchResponse>;
  getBranchTeachers(
    options: GetBranchTeachersRequest
  ): Promise<GetBranchTeachersResponse>;
  assignStudentToBranch(
    options: AssignStudentToBranchRequest
  ): Promise<AssignStudentToBranchResponse>;
  unassignStudentFromBranch(
    options: UnassignStudentFromBranchRequest
  ): Promise<UnassignStudentFromBranchResponse>;
  getBranchStudents(
    options: GetBranchStudentsRequest
  ): Promise<GetBranchStudentsResponse>;
}
