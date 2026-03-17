import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { TransformResponseInterceptor } from '@performa-edu/libs';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { SWAGGER_DARK_CSS } from './swagger/swagger-dark-theme';

async function bootstrap(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 500 * 1024 * 1024, // 500 MB
    }),
    {
      cors: {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
      logger: ['debug', 'error', 'log', 'warn', 'verbose'],
    }
  );

  await app.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024, // 500 MB
    },
  });

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

  // Setup Swagger
  const openApiPath = path.join(__dirname, 'swagger', 'openapi.yaml');
  let document: OpenAPIObject | (() => OpenAPIObject);

  if (fs.existsSync(openApiPath)) {
    const yamlContent = fs.readFileSync(openApiPath, 'utf8');
    document = yaml.parse(yamlContent);
  } else {
    const config = new DocumentBuilder()
      .setTitle('Performa Studio API')
      .setDescription('API for Performa Studio')
      .setVersion('1.0.0')
      .addServer('/api/v1', 'API v1')
      .addBearerAuth()
      .build();
    document = SwaggerModule.createDocument(app, config);
  }

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Performa Studio API Docs',
    customCss: SWAGGER_DARK_CSS,
  });

  Logger.log(`📚 Swagger documentation available at /api/docs`);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;
  const host = configService.get<string>('HOST') || '0.0.0.0';
  await app.listen(port, host);

  Logger.log(`🚀 Application is running on: http://${host}:${port}/api`);

  return app;
}

bootstrap();
