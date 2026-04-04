/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { TEACHERSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/teacher-service';
import { join } from 'path';

async function bootstrap() {
  const grpcPort = process.env.TEACHER_SERVICE_GRPC_PORT;
  const grpcHost = process.env.TEACHER_SERVICE_GRPC_HOST;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [TEACHERSERVICE_PACKAGE_NAME],
        protoPath: [join(process.cwd(), 'proto/teacher-service.proto')],
        url: `${grpcHost}:${grpcPort}`,
        loader: {
          defaults: true,
          arrays: true,
          objects: true,
        },
      },
    }
  );

  await app.listen();

  Logger.log(
    `🚀 Teacher Service gRPC server running at ${grpcHost}:${grpcPort}`
  );
}

bootstrap().catch((err) => {
  Logger.error('Error starting Teacher Service gRPC server', err);
  process.exit(1);
});
