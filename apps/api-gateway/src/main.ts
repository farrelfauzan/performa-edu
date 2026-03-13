import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { TransformResponseInterceptor } from '@performa-edu/libs';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 3 * 1024 * 1024, // 3 MB
    }),
    { cors: true, logger: ['debug', 'error', 'log', 'warn', 'verbose'] }
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    defaultVersion: '1',
    prefix: 'v',
    type: 0,
  });

  const reflector = app.get(Reflector);

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformResponseInterceptor()
  );

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;
  const host = configService.get<string>('HOST') || '0.0.0.0';
  await app.listen(port, host);

  Logger.log(`🚀 Application is running on: http://${host}:${port}/api`);

  return app;
}

bootstrap();
