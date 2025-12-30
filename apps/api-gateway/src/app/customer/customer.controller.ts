import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  GetAllCustomerDto,
  GrpcErrorHandler,
  handleGrpcCall,
} from '@performa-edu/libs';
import {
  CUSTOMERSERVICE_PACKAGE_NAME,
  CustomerServiceClient,
  GetAllCustomersResponse,
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
      CUSTOMERSERVICE_PACKAGE_NAME
    );
  }

  @Auth([
    {
      action: AclAction.READ,
      subject: AclSubject.CUSTOMER,
    },
  ])
  @Get()
  async getCustomers(
    options: GetAllCustomerDto
  ): Promise<GetAllCustomersResponse> {
    const convertedOptions = {
      ...options,
      filter: options.filter
        ? {
            ...options.filter,
            values: Object.fromEntries(
              Object.entries(options.filter.values || {}).map(
                ([key, value]) => [key, String(value)]
              )
            ),
          }
        : undefined,
    };

    const result = await handleGrpcCall(
      this.customerService.getAllCustomers(convertedOptions),
      this.grpcErrorHandler,
      'Failed to fetch customers'
    );

    return result;
  }
}
