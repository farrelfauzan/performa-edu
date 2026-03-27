import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { QUIZSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/quiz-service';
import { join } from 'path';

async function bootstrap() {
  const grpcPort = process.env.QUIZ_SERVICE_GRPC_PORT;
  const grpcHost = process.env.QUIZ_SERVICE_GRPC_HOST;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [QUIZSERVICE_PACKAGE_NAME],
        protoPath: [join(process.cwd(), 'proto/quiz-service.proto')],
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

  Logger.log(`🚀 Quiz Service gRPC server running at ${grpcHost}:${grpcPort}`);
}

bootstrap().catch((err) => {
  Logger.error('Error starting Quiz Service gRPC server', err);
  process.exit(1);
});
