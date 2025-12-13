/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { STUDENTSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/student-service';
import { join } from 'path';

async function bootstrap() {
  const grpcPort = process.env.STUDENT_SERVICE_GRPC_PORT;
  const grpcHost = process.env.STUDENT_SERVICE_GRPC_HOST;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [STUDENTSERVICE_PACKAGE_NAME],
        protoPath: [join(process.cwd(), 'proto/student-service.proto')],
        url: `${grpcHost}:${grpcPort}`,
      },
    }
  );

  await app.listen();
  Logger.log(`🚀 Student Service is listening on ${grpcHost}:${grpcPort}`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start Student Service', error);
  process.exit(1);
});
