import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTHSERVICE_PACKAGE_NAME } from 'types/proto/auth-service';
import { join } from 'path';
import { AuthController } from './auth/auth.controller';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { ClsModule } from 'nestjs-cls';
import { GrpcErrorHandler } from '@performa-edu/libs';
import { TEACHERSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/teacher-service';
import { CONTENTSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/content-service';
import { STUDENTSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/student-service';
import { QUIZSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/quiz-service';
import { CLASSSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/class-service';
import { BRANCHSERVICE_PACKAGE_NAME } from '@performa-edu/proto-types/branch-service';
import { TeacherController } from './teacher/teacher.controller';
import { ContentController } from './content/content.controller';
import { StudentController } from './student/student.controller';
import { AssignmentController } from './assignment/assignment.controller';
import { QuizController } from './quiz/quiz.controller';
import { ClassController } from './class/class.controller';
import { BranchController } from './branch/branch.controller';
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ClientsModule.register([
      {
        name: AUTHSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: AUTHSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/auth-service.proto'),
          url: `${process.env.AUTH_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.AUTH_SERVICE_GRPC_PORT || '50051'
          }`,
        },
      },
      {
        name: TEACHERSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: TEACHERSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/teacher-service.proto'),
          url: `${process.env.TEACHER_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.TEACHER_SERVICE_GRPC_PORT || '50052'
          }`,
        },
      },
      {
        name: CONTENTSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: CONTENTSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/content-service.proto'),
          url: `${process.env.CONTENT_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.CONTENT_SERVICE_GRPC_PORT || '50053'
          }`,
        },
      },
      {
        name: STUDENTSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: STUDENTSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/student-service.proto'),
          url: `${process.env.STUDENT_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.STUDENT_SERVICE_GRPC_PORT || '50054'
          }`,
        },
      },
      {
        name: QUIZSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: QUIZSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/quiz-service.proto'),
          url: `${process.env.QUIZ_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.QUIZ_SERVICE_GRPC_PORT || '50055'
          }`,
        },
      },
      {
        name: CLASSSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: CLASSSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/class-service.proto'),
          url: `${process.env.CLASS_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.CLASS_SERVICE_GRPC_PORT || '50056'
          }`,
        },
      },
      {
        name: BRANCHSERVICE_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: BRANCHSERVICE_PACKAGE_NAME,
          protoPath: join(__dirname, 'proto/branch-service.proto'),
          url: `${process.env.BRANCH_SERVICE_GRPC_HOST || 'localhost'}:${
            process.env.BRANCH_SERVICE_GRPC_PORT || '50057'
          }`,
        },
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    TeacherController,
    ContentController,
    StudentController,
    AssignmentController,
    QuizController,
    ClassController,
    BranchController,
  ],
  providers: [
    AppService,
    GrpcErrorHandler,
    JwtStrategy,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
