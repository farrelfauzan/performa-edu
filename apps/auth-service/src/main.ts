/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_PACKAGE_NAME } from 'types/proto/auth-service';
import { join } from 'path';

async function bootstrap() {
  const grpcPort = process.env.GRPC_PORT;
  const grpcHost = process.env.GRPC_HOST;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: AUTHSERVICE_PACKAGE_NAME,
        protoPath: join(__dirname, 'proto/auth-service.proto'),
        url: `${grpcHost}:${grpcPort}`,
      },
    }
  );

  await app.listen();

  Logger.log(`🚀 Auth service is running on ${grpcHost}:${grpcPort}`);
}

bootstrap();
