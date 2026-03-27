import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import {
  DynamicQueryBuilder,
  GrpcErrorHandler,
  PrismaModule,
} from '@performa-edu/libs';
import { ConfigModule } from '@nestjs/config';
import { QuizRepository } from './repositories/quiz.repository';
import { AttemptRepository } from './repositories/attempt.repository';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizRepository,
    AttemptRepository,
    DynamicQueryBuilder,
    GrpcErrorHandler,
  ],
})
export class AppModule {}
