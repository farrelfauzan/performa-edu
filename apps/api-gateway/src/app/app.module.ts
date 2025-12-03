import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_PACKAGE_NAME } from 'types/proto/auth-service';
import { join } from 'path';
import { AuthController } from './auth/auth.controller';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { GrpcErrorHandler } from './common/grpc-error.handler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { ClsModule } from 'nestjs-cls';
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
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     privateKey:
    //       configService.get<string>('JWT_PRIVATE_KEY') || 'your-secret-key',
    //     publicKey:
    //       configService.get<string>('JWT_PUBLIC_KEY') || 'your-secret-key',
    //     signOptions: {
    //       algorithm: 'RS256',
    //       expiresIn: 86400, // 24 hours
    //     },
    //     verifyOptions: {
    //       algorithms: ['RS256'],
    //     },
    //   }),
    // }),
    ClientsModule.register([
      {
        name: AUTHSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: AUTHSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/auth-service.proto'),
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
