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
    ]),
  ],
  controllers: [AppController, AuthController],
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
