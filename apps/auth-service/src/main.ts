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
import { HealthImplementation } from 'grpc-health-check';

async function bootstrap() {
  const grpcPort = process.env.AUTH_SERVICE_GRPC_PORT;
  const grpcHost = process.env.AUTH_SERVICE_GRPC_HOST;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: [AUTHSERVICE_PACKAGE_NAME, 'authservicehealth'],
        protoPath: [
          join(process.cwd(), 'proto/auth-service.proto'),
          join(process.cwd(), 'proto/auth-service-health.proto'),
        ],
        loader: {
          defaults: true,
          arrays: true,
          objects: true,
        },
        url: `${grpcHost}:${grpcPort}`,
        onLoadPackageDefinition: (pkg, server) => {
          // Initialize health check implementation
          const healthImpl = new HealthImplementation({
            // Set default health status
            '': 'SERVING',
            'authservice.AuthService': 'SERVING',
          });

          // Add health service to gRPC server
          healthImpl.addToServer(server);

          // Set initial health status
          healthImpl.setStatus('', 'SERVING');
          healthImpl.setStatus('authservice.AuthService', 'SERVING');

          // Handle graceful shutdown
          process.on('SIGTERM', () => {
            Logger.log('Received SIGTERM, shutting down gracefully...');
            healthImpl.setStatus('', 'NOT_SERVING');
            healthImpl.setStatus('authservice.AuthService', 'NOT_SERVING');
          });

          process.on('SIGINT', () => {
            Logger.log('Received SIGINT, shutting down gracefully...');
            healthImpl.setStatus('', 'NOT_SERVING');
            healthImpl.setStatus('authservice.AuthService', 'NOT_SERVING');
          });

          Logger.log('🏥 Health check service configured');
        },
      },
    }
  );

  await app.listen();

  Logger.log(`🚀 Auth service is running on ${grpcHost}:${grpcPort}`);
  Logger.log(`📋 Health checks available via gRPC Health protocol`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start auth service', error);
  process.exit(1);
});
