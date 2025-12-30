import { Controller } from '@nestjs/common';
import { CustomerService } from './customer.service';
import {
  CreateCustomerRequest,
  CreateCustomerResponse,
  CustomerServiceController,
  CustomerServiceControllerMethods,
  DeleteCustomerRequest,
  DeleteCustomerResponse,
  GetAllCustomersRequest,
  GetAllCustomersResponse,
  GetCustomerByIdRequest,
  GetCustomerByIdResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
} from '@performa-edu/proto-types/customer-service';

@Controller()
@CustomerServiceControllerMethods()
export class CustomerController implements CustomerServiceController {
  constructor(private readonly customerService: CustomerService) {}

  async getAllCustomers(
    options: GetAllCustomersRequest
  ): Promise<GetAllCustomersResponse> {
    const result = await this.customerService.getAllCustomers(options);
    return result;
  }

  async getCustomerById(
    options: GetCustomerByIdRequest
  ): Promise<GetCustomerByIdResponse> {
    const result = await this.customerService.getCustomerById(options.id);
    return result;
  }

  async createCustomer(
    options: CreateCustomerRequest
  ): Promise<CreateCustomerResponse> {
    const result = await this.customerService.createCustomer(options);
    return result;
  }

  async updateCustomer(
    options: UpdateCustomerRequest
  ): Promise<UpdateCustomerResponse> {
    const result = await this.customerService.updateCustomer(
      options.id,
      options
    );
    return result;
  }

  async deleteCustomer(
    options: DeleteCustomerRequest
  ): Promise<DeleteCustomerResponse> {
    const result = await this.customerService.deleteCustomer(options);
    return result;
  }
}
