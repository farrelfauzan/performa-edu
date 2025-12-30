import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/auth-service';
import { join } from 'path';
import { CustomerRepository } from './repositories/customer.repository';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: AUTHSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: AUTHSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/auth-service.proto'),
          url: `${process.env.AUTH_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.AUTH_SERVICE_GRPC_PORT || '50051'
          }`,
        },
      },
    ]),
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerRepository,
    DynamicQueryBuilder,
    GrpcErrorHandler,
  ],
})
export class AppModule {}
