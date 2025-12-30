import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { DynamicQueryBuilder, PrismaModule } from '@performa-edu/libs';
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
          url: `${process.env.AUTH_SERVICE_GRPC_HOST}:${process.env.AUTH_SERVICE_GRPC_PORT}`,
          package: AUTHSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/auth-service.proto'),
        },
      },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerRepository, DynamicQueryBuilder],
})
export class AppModule {}
