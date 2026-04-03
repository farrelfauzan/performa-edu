import { Controller } from '@nestjs/common';
import { BranchService } from './branch.service';
import {
  CreateBranchRequest,
  CreateBranchResponse,
  BranchServiceController,
  BranchServiceControllerMethods,
  DeleteBranchRequest,
  DeleteBranchResponse,
  GetAllBranchesRequest,
  GetAllBranchesResponse,
  GetBranchByIdRequest,
  GetBranchByIdResponse,
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
} from '@performa-edu/proto-types/branch-service';

@Controller()
@BranchServiceControllerMethods()
export class BranchController implements BranchServiceController {
  constructor(private readonly branchService: BranchService) {}

  async createBranch(
    options: CreateBranchRequest
  ): Promise<CreateBranchResponse> {
    return await this.branchService.createBranch(options);
  }

  async getBranchById(
    options: GetBranchByIdRequest
  ): Promise<GetBranchByIdResponse> {
    return await this.branchService.getBranchById(options.id);
  }

  async updateBranch(
    options: UpdateBranchRequest
  ): Promise<UpdateBranchResponse> {
    return await this.branchService.updateBranch(options.id, options);
  }

  async deleteBranch(
    options: DeleteBranchRequest
  ): Promise<DeleteBranchResponse> {
    return await this.branchService.deleteBranch(options);
  }

  async getAllBranches(
    options: GetAllBranchesRequest
  ): Promise<GetAllBranchesResponse> {
    return await this.branchService.getAllBranches(options);
  }

  async assignCustomerToBranch(
    options: AssignCustomerToBranchRequest
  ): Promise<AssignCustomerToBranchResponse> {
    return await this.branchService.assignCustomerToBranch(options);
  }

  async unassignCustomerFromBranch(
    options: UnassignCustomerFromBranchRequest
  ): Promise<UnassignCustomerFromBranchResponse> {
    return await this.branchService.unassignCustomerFromBranch(options);
  }

  async getBranchCustomers(
    options: GetBranchCustomersRequest
  ): Promise<GetBranchCustomersResponse> {
    return await this.branchService.getBranchCustomers(options);
  }

  async assignStudentToBranch(
    options: AssignStudentToBranchRequest
  ): Promise<AssignStudentToBranchResponse> {
    return await this.branchService.assignStudentToBranch(options);
  }

  async unassignStudentFromBranch(
    options: UnassignStudentFromBranchRequest
  ): Promise<UnassignStudentFromBranchResponse> {
    return await this.branchService.unassignStudentFromBranch(options);
  }

  async getBranchStudents(
    options: GetBranchStudentsRequest
  ): Promise<GetBranchStudentsResponse> {
    return await this.branchService.getBranchStudents(options);
  }
}
