import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CONTENTSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/content-service';
import { ContentRepository } from './repositories/content.repository';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: CONTENTSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: CONTENTSERVICE_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto/content-service.proto'),
          url: `${process.env.CONTENT_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.CONTENT_SERVICE_GRPC_PORT || '50053'
          }`,
        },
      },
    ]),
  ],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentRepository,
    DynamicQueryBuilder,
    GrpcErrorHandler,
  ],
})
export class ContentModule {}
