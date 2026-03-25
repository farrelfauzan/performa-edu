import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { AUTHSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/auth-service';
import { join } from 'path';
import { StudentRepository } from './repositories/student.repository';
import { AssignmentRepository } from './repositories/assignment.repository';
import { ProgressRepository } from './repositories/progress.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  controllers: [StudentController],
  providers: [
    StudentService,
    StudentRepository,
    AssignmentRepository,
    ProgressRepository,
    DynamicQueryBuilder,
    GrpcErrorHandler,
  ],
})
export class AppModule {}
