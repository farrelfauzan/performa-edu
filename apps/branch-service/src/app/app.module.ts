import { Module } from '@nestjs/common';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';
import { BranchRepository } from './repositories/branch.repository';

@Module({
  imports: [PrismaModule],
  controllers: [BranchController],
  providers: [
    BranchService,
    BranchRepository,
    DynamicQueryBuilder,
    GrpcErrorHandler,
  ],
})
export class AppModule {}
