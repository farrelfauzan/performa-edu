import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  GetAllCustomerDto,
  GrpcErrorHandler,
  handleGrpcCall,
  ProtoHelper,
  UpdateCustomerDto,
} from '@performa-edu/libs';
import {
  Customer,
  CUSTOMER_SERVICE_NAME,
  CUSTOMERSERVICE_PACKAGE_NAME,
  CustomerServiceClient,
  DeleteCustomerResponse,
  GetAllCustomersResponse,
  GetCustomerByIdResponse,
  UpdateCustomerResponse,
} from '@performa-edu/proto-types/customer-service';
import { AclAction, AclSubject } from 'libs/src/constant';

@Controller({
  version: '1',
  path: 'customers',
})
export class CustomerController implements OnModuleInit {
  private customerService: CustomerServiceClient;

  constructor(
    @Inject(CUSTOMERSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.customerService = this.client.getService<CustomerServiceClient>(
      CUSTOMER_SERVICE_NAME
    );
  }

  @Auth([
    {
      action: AclAction.READ,
      subject: AclSubject.CUSTOMER,
    },
  ])
  @Get()
  async getCustomers(@Query() options: GetAllCustomerDto): Promise<{
    data: GetAllCustomersResponse['customers'];
    meta: GetAllCustomersResponse['meta'];
  }> {
    const result = await handleGrpcCall(
      this.customerService.getAllCustomers(options),
      this.grpcErrorHandler,
      'Failed to fetch customers'
    );

    return {
      data: ProtoHelper.normalizeMany<Customer>(result.customers, {
        defaults: {
          deletedAt: null,
          dateOfBirth: null,
          user: null,
        },
      }),
      meta: result.meta,
    };
  }

  @Auth([
    {
      action: AclAction.READ,
      subject: AclSubject.CUSTOMER,
    },
  ])
  @Get(':id')
  async getCustomerById(@Param('id') id: string): Promise<{
    data: GetCustomerByIdResponse['customer'];
  }> {
    const result = await handleGrpcCall(
      this.customerService.getCustomerById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch customer by ID'
    );

    return {
      data: ProtoHelper.normalize<Customer>(result.customer, {
        defaults: {
          deletedAt: null,
          dateOfBirth: null,
          user: null,
        },
      }),
    };
  }

  @Auth([
    {
      action: AclAction.UPDATE,
      subject: AclSubject.CUSTOMER,
    },
  ])
  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() options: UpdateCustomerDto
  ): Promise<{
    data: UpdateCustomerResponse['customer'];
  }> {
    const result = await handleGrpcCall(
      this.customerService.updateCustomer({
        id,
        ...options,
      }),
      this.grpcErrorHandler,
      'Failed to update customer'
    );

    return {
      data: ProtoHelper.normalize<Customer>(result.customer, {
        defaults: {
          deletedAt: null,
          dateOfBirth: null,
          user: null,
        },
      }),
    };
  }

  @Auth([
    {
      action: AclAction.DELETE,
      subject: AclSubject.CUSTOMER,
    },
  ])
  @Delete(':id')
  async deleteCustomer(@Param('id') id: string): Promise<{
    data: DeleteCustomerResponse;
  }> {
    const result = await handleGrpcCall(
      this.customerService.deleteCustomer({ id }),
      this.grpcErrorHandler,
      'Failed to delete customer'
    );

    return { data: result };
  }
}
