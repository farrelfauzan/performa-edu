import { PageMetaDto } from '@performa-edu/libs';
import {
  CreateBranchRequest,
  CreateBranchResponse,
  DeleteBranchRequest,
  DeleteBranchResponse,
  GetAllBranchesRequest,
  UpdateBranchRequest,
  UpdateBranchResponse,
  AssignCustomerToBranchRequest,
  AssignCustomerToBranchResponse,
  UnassignCustomerFromBranchRequest,
  UnassignCustomerFromBranchResponse,
  GetBranchCustomersRequest,
  GetBranchCustomersResponse,
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
  assignCustomerToBranch(
    options: AssignCustomerToBranchRequest
  ): Promise<AssignCustomerToBranchResponse>;
  unassignCustomerFromBranch(
    options: UnassignCustomerFromBranchRequest
  ): Promise<UnassignCustomerFromBranchResponse>;
  getBranchCustomers(
    options: GetBranchCustomersRequest
  ): Promise<GetBranchCustomersResponse>;
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
