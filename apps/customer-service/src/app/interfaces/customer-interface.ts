import { Customer, PageMetaDto } from '@performa-edu/libs';
import {
  CreateCustomerRequest,
  CreateCustomerResponse,
  DeleteCustomerRequest,
  DeleteCustomerResponse,
  GetAllCustomersRequest,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
} from '@performa-edu/proto-types/customer-service';

export interface ICustomerRepository {
  // Define repository methods here
  createCustomer(
    options: CreateCustomerRequest
  ): Promise<CreateCustomerResponse>;
  getAllCustomers(options: GetAllCustomersRequest): Promise<{
    data: Customer[];
    meta: PageMetaDto;
  }>;
  getCustomerById(id: string): Promise<{
    data: Customer;
  }>;
  updateCustomer(
    id: string,
    options: UpdateCustomerRequest
  ): Promise<UpdateCustomerResponse>;
  deleteCustomer(
    options: DeleteCustomerRequest
  ): Promise<DeleteCustomerResponse>;
}
