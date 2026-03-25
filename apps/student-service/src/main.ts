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
    `🚀 Student Service gRPC server running at ${grpcHost}:${grpcPort}`
  );
}

bootstrap().catch((err) => {
  Logger.error('Error starting Student Service gRPC server', err);
  process.exit(1);
});
