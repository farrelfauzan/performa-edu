import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  AuthUser,
  GrpcErrorHandler,
  handleGrpcCall,
  LoggedUserType,
  CreateQuizDto,
  UpdateQuizDto,
  GetAllQuizzesDto,
  AddQuestionDto,
  UpdateQuestionDto,
  ReorderQuestionsDto,
  SubmitAnswerDto,
} from '@performa-edu/libs';
import {
  QUIZ_SERVICE_NAME,
  QUIZSERVICE_PACKAGE_NAME,
  QuizServiceClient,
} from '@performa-edu/proto-types/quiz-service';
import { AclAction, AclSubject } from 'libs/src/constant';

@Controller({
  version: '1',
  path: 'quizzes',
})
export class QuizController implements OnModuleInit {
  private quizService: QuizServiceClient;

  constructor(
    @Inject(QUIZSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.quizService =
      this.client.getService<QuizServiceClient>(QUIZ_SERVICE_NAME);
  }

  // ── Quiz CRUD ──

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.QUIZ }])
  @Post()
  async createQuiz(
    @Body() body: CreateQuizDto,
    @AuthUser() user: LoggedUserType
  ) {
    const result = await handleGrpcCall(
      this.quizService.createQuiz({
        userId: user.userId,
        ...body,
      }),
      this.grpcErrorHandler,
      'Failed to create quiz'
    );
    return { data: result.quiz };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.QUIZ }])
  @Get()
  async getAllQuizzes(
    @Query() options: GetAllQuizzesDto,
    @AuthUser() user: LoggedUserType
  ) {
    const result = await handleGrpcCall(
      this.quizService.getAllQuizzes({
        userId: user.userId,
        ...options,
      }),
      this.grpcErrorHandler,
      'Failed to fetch quizzes'
    );
    return { data: result.quizzes, meta: result.meta };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.QUIZ }])
  @Get(':id')
  async getQuizById(@Param('id') id: string) {
    const result = await handleGrpcCall(
      this.quizService.getQuizById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch quiz'
    );
    return { data: result.quiz };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Put(':id')
  async updateQuiz(@Param('id') id: string, @Body() body: UpdateQuizDto) {
    const result = await handleGrpcCall(
      this.quizService.updateQuiz({ id, ...body }),
      this.grpcErrorHandler,
      'Failed to update quiz'
    );
    return { data: result.quiz };
  }

  @Auth([{ action: AclAction.DELETE, subject: AclSubject.QUIZ }])
  @Delete(':id')
  async deleteQuiz(@Param('id') id: string) {
    const result = await handleGrpcCall(
      this.quizService.deleteQuiz({ id }),
      this.grpcErrorHandler,
      'Failed to delete quiz'
    );
    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Post(':id/publish')
  async publishQuiz(@Param('id') id: string) {
    const result = await handleGrpcCall(
      this.quizService.publishQuiz({ id }),
      this.grpcErrorHandler,
      'Failed to publish quiz'
    );
    return { data: result.quiz };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Post(':id/unpublish')
  async unpublishQuiz(@Param('id') id: string) {
    const result = await handleGrpcCall(
      this.quizService.unpublishQuiz({ id }),
      this.grpcErrorHandler,
      'Failed to unpublish quiz'
    );
    return { data: result.quiz };
  }

  // ── Question management ──

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.QUIZ }])
  @Post(':quizId/questions')
  async addQuestion(
    @Param('quizId') quizId: string,
    @Body() body: AddQuestionDto
  ) {
    const result = await handleGrpcCall(
      this.quizService.addQuestion({ quizId, ...body }),
      this.grpcErrorHandler,
      'Failed to add question'
    );
    return { data: result.question };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Post(':quizId/questions/:questionId/upload-url')
  async getQuestionPictureUploadUrl(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() body: { filename: string; contentType: string }
  ) {
    const result = await handleGrpcCall(
      this.quizService.getQuestionPictureUploadUrl({
        quizId,
        questionId,
        filename: body.filename,
        contentType: body.contentType,
      }),
      this.grpcErrorHandler,
      'Failed to get upload URL'
    );
    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Put(':quizId/questions/:questionId')
  async updateQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
    @Body() body: UpdateQuestionDto
  ) {
    const result = await handleGrpcCall(
      this.quizService.updateQuestion({ quizId, questionId, ...body }),
      this.grpcErrorHandler,
      'Failed to update question'
    );
    return { data: result.question };
  }

  @Auth([{ action: AclAction.DELETE, subject: AclSubject.QUIZ }])
  @Delete(':quizId/questions/:questionId')
  async deleteQuestion(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string
  ) {
    const result = await handleGrpcCall(
      this.quizService.deleteQuestion({ quizId, questionId }),
      this.grpcErrorHandler,
      'Failed to delete question'
    );
    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Post(':quizId/questions/reorder')
  async reorderQuestions(
    @Param('quizId') quizId: string,
    @Body() body: ReorderQuestionsDto
  ) {
    const result = await handleGrpcCall(
      this.quizService.reorderQuestions({
        quizId,
        questionIds: body.questionIds,
      }),
      this.grpcErrorHandler,
      'Failed to reorder questions'
    );
    return { data: result };
  }

  // ── Attempts ──

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.QUIZ }])
  @Post(':quizId/attempts')
  async startAttempt(
    @Param('quizId') quizId: string,
    @AuthUser() user: LoggedUserType
  ) {
    const result = await handleGrpcCall(
      this.quizService.startAttempt({ quizId, userId: user.userId }),
      this.grpcErrorHandler,
      'Failed to start attempt'
    );
    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Post('attempts/:attemptId/answers')
  async submitAnswer(
    @Param('attemptId') attemptId: string,
    @Body() body: SubmitAnswerDto
  ) {
    const result = await handleGrpcCall(
      this.quizService.submitAnswer({ attemptId, ...body }),
      this.grpcErrorHandler,
      'Failed to submit answer'
    );
    return { data: result };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.QUIZ }])
  @Post('attempts/:attemptId/submit')
  async submitAttempt(@Param('attemptId') attemptId: string) {
    const result = await handleGrpcCall(
      this.quizService.submitAttempt({ attemptId }),
      this.grpcErrorHandler,
      'Failed to submit attempt'
    );
    return { data: result.attempt };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.QUIZ }])
  @Get('attempts/:attemptId/result')
  async getAttemptResult(@Param('attemptId') attemptId: string) {
    const result = await handleGrpcCall(
      this.quizService.getAttemptResult({ attemptId }),
      this.grpcErrorHandler,
      'Failed to fetch attempt result'
    );
    return { data: result };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.QUIZ }])
  @Get(':quizId/attempts')
  async getAttemptHistory(
    @Param('quizId') quizId: string,
    @Query('userId') userId?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number
  ) {
    const result = await handleGrpcCall(
      this.quizService.getAttemptHistory({
        quizId,
        userId,
        page,
        pageSize,
      }),
      this.grpcErrorHandler,
      'Failed to fetch attempt history'
    );
    return { data: result.attempts, meta: result.meta };
  }

  // ── Analytics ──

  @Auth([{ action: AclAction.READ, subject: AclSubject.QUIZ }])
  @Get(':quizId/analytics')
  async getQuizAnalytics(@Param('quizId') quizId: string) {
    const result = await handleGrpcCall(
      this.quizService.getQuizAnalytics({ quizId }),
      this.grpcErrorHandler,
      'Failed to fetch quiz analytics'
    );
    return { data: result };
  }
}
