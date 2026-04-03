import { Module } from '@nestjs/common';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';
import { ClassRepository } from './repositories/class.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ClassController],
  providers: [
    ClassService,
    ClassRepository,
    DynamicQueryBuilder,
    GrpcErrorHandler,
  ],
})
export class AppModule {}
