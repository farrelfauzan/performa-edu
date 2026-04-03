import { Injectable, Logger } from '@nestjs/common';
import { BranchRepository } from './repositories/branch.repository';
import {
  CreateBranchRequest,
  CreateBranchResponse,
  DeleteBranchRequest,
  DeleteBranchResponse,
  GetAllBranchesRequest,
  GetAllBranchesResponse,
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

@Injectable()
export class BranchService {
  private readonly logger = new Logger(BranchService.name);

  constructor(private readonly branchRepository: BranchRepository) {}

  async getAllBranches(
    options: GetAllBranchesRequest
  ): Promise<GetAllBranchesResponse> {
    const { data, meta } = await this.branchRepository.getAllBranches(options);
    return { branches: data, meta };
  }

  async getBranchById(id: string): Promise<GetBranchByIdResponse> {
    const { data } = await this.branchRepository.getBranchById(id);
    return { branch: data };
  }

  async createBranch(
    options: CreateBranchRequest
  ): Promise<CreateBranchResponse> {
    return await this.branchRepository.createBranch(options);
  }

  async updateBranch(
    id: string,
    options: UpdateBranchRequest
  ): Promise<UpdateBranchResponse> {
    return await this.branchRepository.updateBranch(id, options);
  }

  async deleteBranch(
    options: DeleteBranchRequest
  ): Promise<DeleteBranchResponse> {
    return await this.branchRepository.deleteBranch(options);
  }

  // Customer (Teacher) membership
  async assignCustomerToBranch(
    options: AssignCustomerToBranchRequest
  ): Promise<AssignCustomerToBranchResponse> {
    return await this.branchRepository.assignCustomerToBranch(options);
  }

  async unassignCustomerFromBranch(
    options: UnassignCustomerFromBranchRequest
  ): Promise<UnassignCustomerFromBranchResponse> {
    return await this.branchRepository.unassignCustomerFromBranch(options);
  }

  async getBranchCustomers(
    options: GetBranchCustomersRequest
  ): Promise<GetBranchCustomersResponse> {
    return await this.branchRepository.getBranchCustomers(options);
  }

  // Student membership
  async assignStudentToBranch(
    options: AssignStudentToBranchRequest
  ): Promise<AssignStudentToBranchResponse> {
    return await this.branchRepository.assignStudentToBranch(options);
  }

  async unassignStudentFromBranch(
    options: UnassignStudentFromBranchRequest
  ): Promise<UnassignStudentFromBranchResponse> {
    return await this.branchRepository.unassignStudentFromBranch(options);
  }

  async getBranchStudents(
    options: GetBranchStudentsRequest
  ): Promise<GetBranchStudentsResponse> {
    return await this.branchRepository.getBranchStudents(options);
  }
}
