import { Injectable } from '@nestjs/common';
import { ICustomerRepository } from '../interfaces/customer-interface';
import {
  CreateCustomerDto,
  Customer,
  DynamicQueryBuilder,
  generateUniqueId,
  PageMeta,
  PageMetaDto,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import {
  CreateCustomerRequest,
  CreateCustomerResponse,
  DeleteCustomerRequest,
  DeleteCustomerResponse,
  GetAllCustomersRequest,
  UpdateCustomerRequest,
  UpdateCustomerResponse,
} from '@performa-edu/proto-types/customer-service';
import { CustomerNotFoundError } from '../error/customer.error';

@Injectable()
export class CustomerRepository implements ICustomerRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder
  ) {}

  async createCustomer(
    options: CreateCustomerRequest
  ): Promise<CreateCustomerResponse> {
    const customer = await this.prisma.customer.create({
      data: {
        userId: options.userId,
        uniqueId: generateUniqueId('CUST'),
        fullName: options.fullName,
        phoneNumber: options.phoneNumber,
        ...(options.dateOfBirth
          ? { dateOfBirth: new Date(options.dateOfBirth) }
          : {}),
      },
    });

    return {
      customer: transformResponse<Customer>(customer),
    };
  }

  async getAllCustomers(
    options: GetAllCustomersRequest
  ): Promise<{ data: Customer[]; meta: PageMetaDto }> {
    const searchFiled = ['fullName', 'phoneNumber'];

    const customers = await this.dynamicQueryBuilder.buildDynamicQuery(
      'Customer',
      {
        ...options,
        where: {
          OR: searchFiled.map((field) => ({
            [field]: {
              contains: options.search || '',
              mode: 'insensitive',
            },
          })),
        },
      }
    );

    const meta: PageMeta = {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      count: customers.count,
    };

    return {
      data: transformResponse<Customer[]>(customers.data),
      meta,
    };
  }

  async getCustomerById(id: string): Promise<{ data: Customer }> {
    const customer = await this.prisma.findFirstActive<Customer>(
      this.prisma.customer,
      {
        where: { id },
      }
    );

    if (!customer) {
      CustomerNotFoundError(id);
    }

    return { data: transformResponse<Customer>(customer) };
  }

  async updateCustomer(
    id: string,
    options: UpdateCustomerRequest
  ): Promise<UpdateCustomerResponse> {
    const customer = this.prisma.findFirstActive<Customer>(
      this.prisma.customer,
      {
        where: { id },
      }
    );

    if (!customer) {
      CustomerNotFoundError(id);
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: {
        fullName: options.fullName,
        phoneNumber: options.phoneNumber,
        dateOfBirth: options.dateOfBirth,
      },
    });

    return {
      customer: transformResponse<Customer>(updatedCustomer),
    };
  }

  async deleteCustomer(
    options: DeleteCustomerRequest
  ): Promise<DeleteCustomerResponse> {
    const customer = await this.prisma.findFirstActive<Customer>(
      this.prisma.customer,
      {
        where: { id: options.id },
      }
    );

    if (!customer) {
      CustomerNotFoundError(options.id);
    }

    await this.prisma.softDelete<Customer>(this.prisma.customer, {
      id: options.id,
    });

    return {
      message: 'Customer deleted successfully',
    };
  }
}
