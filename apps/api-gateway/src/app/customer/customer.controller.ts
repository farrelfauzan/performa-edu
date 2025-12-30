import {
  Body,
  Controller,
  Get,
  Inject,
  OnModuleInit,
  Post,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  CreateCustomerDto,
  GetAllCustomerDto,
  GrpcErrorHandler,
  handleGrpcCall,
} from '@performa-edu/libs';
import {
  CreateCustomerResponse,
  CUSTOMER_SERVICE_NAME,
  CUSTOMERSERVICE_PACKAGE_NAME,
  CustomerServiceClient,
  GetAllCustomersResponse,
  GetCustomerByIdResponse,
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
    try {
      const result = await handleGrpcCall(
        this.customerService.getAllCustomers(options),
        this.grpcErrorHandler,
        'Failed to fetch customers'
      );

      return { data: result.customers || [], meta: result.meta };
    } catch (error) {
      throw error;
    }
  }

  @Auth([
    {
      action: AclAction.READ,
      subject: AclSubject.CUSTOMER,
    },
  ])
  @Get(':id')
  async getCustomerById(@Query('id') id: string): Promise<{
    data: GetCustomerByIdResponse['customer'];
  }> {
    try {
      const result = await handleGrpcCall(
        this.customerService.getCustomerById({ id }),
        this.grpcErrorHandler,
        'Failed to fetch customer by ID'
      );

      return { data: result.customer };
    } catch (error) {
      throw error;
    }
  }
}
