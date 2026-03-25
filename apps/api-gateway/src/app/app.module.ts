import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_PACKAGE_NAME } from 'types/proto/auth-service';
import { join } from 'path';
import { AuthController } from './auth/auth.controller';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { ClsModule } from 'nestjs-cls';
import { GrpcErrorHandler } from '@performa-edu/libs';
import { CUSTOMERSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/customer-service';
import { CONTENTSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/content-service';
import { STUDENTSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/student-service';
import { CustomerController } from './customer/customer.controller';
import { ContentController } from './content/content.controller';
import { StudentController } from './student/student.controller';
import { AssignmentController } from './assignment/assignment.controller';
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
      {
        name: CUSTOMERSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: CUSTOMERSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/customer-service.proto'),
          url: `${process.env.CUSTOMER_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.CUSTOMER_SERVICE_GRPC_PORT || '50052'
          }`,
        },
      },
      {
        name: CONTENTSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: CONTENTSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/content-service.proto'),
          url: `${process.env.CONTENT_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.CONTENT_SERVICE_GRPC_PORT || '50053'
          }`,
        },
      },
      {
        name: STUDENTSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: STUDENTSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/student-service.proto'),
          url: `${process.env.STUDENT_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.STUDENT_SERVICE_GRPC_PORT || '50054'
          }`,
        },
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    CustomerController,
    ContentController,
    StudentController,
    AssignmentController,
  ],
  providers: [
    AppService,
    GrpcErrorHandler,
    JwtStrategy,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
