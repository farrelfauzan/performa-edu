import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/auth-service';
import { join } from 'path';
import { TeacherRepository } from './repositories/teacher.repository';

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
  controllers: [TeacherController],
  providers: [
    TeacherService,
    TeacherRepository,
    DynamicQueryBuilder,
    GrpcErrorHandler,
  ],
})
export class AppModule {}
