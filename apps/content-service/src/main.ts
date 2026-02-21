/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ContentModule } from './app/content.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CONTENTSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/content-service';
import { join } from 'path';

async function bootstrap() {
  const grpcPort = process.env.CONTENT_SERVICE_GRPC_PORT;
  const grpcHost = process.env.CONTENT_SERVICE_GRPC_HOST;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ContentModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [CONTENTSERVICE_PACKAGE_NAME],
        protoPath: [join(process.cwd(), 'proto/content-service.proto')],
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
    `🚀 Content Service gRPC server running at ${grpcHost}:${grpcPort}`
  );
}

bootstrap().catch((err) => {
  Logger.error('Error starting Content Service gRPC server', err);
  process.exit(1);
});
