import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CustomerRepository } from './repositories/customer.repository';
import {
  CreateCustomerRequest,
  CreateCustomerResponse,
  DeleteCustomerRequest,
  DeleteCustomerResponse,
  GetAllCustomersRequest,
  GetAllCustomersResponse,
  GetCustomerByIdResponse,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
} from '@performa-edu/proto-types/customer-service';
import {
  Customer,
  GrpcErrorHandler,
  handleGrpcCall,
  transformResponse,
} from '@performa-edu/libs';
import {
  AUTH_SERVICE_NAME,
  AUTHSERVICE_PACKAGE_NAME,
  AuthServiceClient,
} from '@performa-edu/proto-types/auth-service';
import { ClientGrpc } from '@nestjs/microservices';

@Injectable()
export class CustomerService implements OnModuleInit {
  private authService: AuthServiceClient;
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    @Inject(AUTHSERVICE_PACKAGE_NAME)
    private readonly client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler,
    private readonly customerRepository: CustomerRepository
  ) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async getAllCustomers(
    options: GetAllCustomersRequest
  ): Promise<GetAllCustomersResponse> {
    const { data, meta } = await this.customerRepository.getAllCustomers(
      options
    );

    const transformedData = transformResponse<Customer[]>(data);

    const result = await Promise.all(
      transformedData.map(async (cst: Customer) => ({
        ...cst,
        user: await handleGrpcCall(
          this.authService.getUserById({ id: cst.userId }),
          this.grpcErrorHandler,
          'Failed to fetch user data'
        ),
      }))
    );

    return { customers: result, meta };
  }

  async getCustomerById(id: string): Promise<GetCustomerByIdResponse> {
    const { data } = await this.customerRepository.getCustomerById(id);

    const transformedData = transformResponse<Customer>(data);

    const user = await handleGrpcCall(
      this.authService.getUserById({ id: transformedData.userId }),
      this.grpcErrorHandler,
      'Failed to fetch user data'
    );

    const customerWithUser = {
      ...transformedData,
      user,
    };

    return { customer: customerWithUser };
  }

  async createCustomer(
    options: CreateCustomerRequest
  ): Promise<CreateCustomerResponse> {
    const data = await this.customerRepository.createCustomer(options);

    return {
      customer: data.customer,
    };
  }

  async updateCustomer(
    id: string,
    options: UpdateCustomerRequest
  ): Promise<UpdateCustomerResponse> {
    const data = await this.customerRepository.updateCustomer(id, options);
    return { customer: data.customer };
  }

  async deleteCustomer(
    options: DeleteCustomerRequest
  ): Promise<DeleteCustomerResponse> {
    return await this.customerRepository.deleteCustomer(options);
  }
}
