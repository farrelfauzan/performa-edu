import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentRepository } from './repositories/student.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/auth-service';
import { join } from 'path';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';

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
  controllers: [StudentController],
  providers: [
    StudentService,
    StudentRepository,
    GrpcErrorHandler,
    DynamicQueryBuilder,
  ],
})
export class AppModule {}
