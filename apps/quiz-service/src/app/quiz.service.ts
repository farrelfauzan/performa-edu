import { Injectable, Logger } from '@nestjs/common';
import { QuizRepository } from './repositories/quiz.repository';
import { AttemptRepository } from './repositories/attempt.repository';
import {
  CreateQuizRequest,
  CreateQuizResponse,
  GetQuizByIdRequest,
  GetQuizByIdResponse,
  UpdateQuizRequest,
  UpdateQuizResponse,
  DeleteQuizRequest,
  DeleteQuizResponse,
  GetAllQuizzesRequest,
  GetAllQuizzesResponse,
  PublishQuizRequest,
  PublishQuizResponse,
  UnpublishQuizRequest,
  UnpublishQuizResponse,
  AddQuestionRequest,
  AddQuestionResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  DeleteQuestionRequest,
  DeleteQuestionResponse,
  ReorderQuestionsRequest,
  ReorderQuestionsResponse,
  StartAttemptRequest,
  StartAttemptResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
  GetAttemptResultRequest,
  GetAttemptResultResponse,
  GetAttemptHistoryRequest,
  GetAttemptHistoryResponse,
  GetQuizAnalyticsRequest,
  GetQuizAnalyticsResponse,
  GetQuestionPictureUploadUrlRequest,
  GetQuestionPictureUploadUrlResponse,
} from '@performa-edu/proto-types/quiz-service';
import { GrpcErrorHandler } from '@performa-edu/libs';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly grpcErrorHandler: GrpcErrorHandler,
    private readonly quizRepository: QuizRepository,
    private readonly attemptRepository: AttemptRepository
  ) {}

  // ── Quiz CRUD ──

  async createQuiz(options: CreateQuizRequest): Promise<CreateQuizResponse> {
    return this.quizRepository.createQuiz(options);
  }

  async getQuizById(options: GetQuizByIdRequest): Promise<GetQuizByIdResponse> {
    const { data } = await this.quizRepository.getQuizById(options.id);
    return { quiz: data };
  }

  async updateQuiz(options: UpdateQuizRequest): Promise<UpdateQuizResponse> {
    return this.quizRepository.updateQuiz(options.id, options);
  }

  async deleteQuiz(options: DeleteQuizRequest): Promise<DeleteQuizResponse> {
    return this.quizRepository.deleteQuiz(options);
  }

  async getAllQuizzes(
    options: GetAllQuizzesRequest
  ): Promise<GetAllQuizzesResponse> {
    const { data, meta } = await this.quizRepository.getAllQuizzes(options);
    return { quizzes: data, meta };
  }

  async publishQuiz(options: PublishQuizRequest): Promise<PublishQuizResponse> {
    return this.quizRepository.publishQuiz(options);
  }

  async unpublishQuiz(
    options: UnpublishQuizRequest
  ): Promise<UnpublishQuizResponse> {
    return this.quizRepository.unpublishQuiz(options);
  }

  // ── Question management ──

  async addQuestion(options: AddQuestionRequest): Promise<AddQuestionResponse> {
    return this.quizRepository.addQuestion(options);
  }

  async updateQuestion(
    options: UpdateQuestionRequest
  ): Promise<UpdateQuestionResponse> {
    return this.quizRepository.updateQuestion(options);
  }

  async deleteQuestion(
    options: DeleteQuestionRequest
  ): Promise<DeleteQuestionResponse> {
    return this.quizRepository.deleteQuestion(options);
  }

  async reorderQuestions(
    options: ReorderQuestionsRequest
  ): Promise<ReorderQuestionsResponse> {
    return this.quizRepository.reorderQuestions(options);
  }

  // ── Attempts ──

  async startAttempt(
    options: StartAttemptRequest
  ): Promise<StartAttemptResponse> {
    return this.attemptRepository.startAttempt(options);
  }

  async submitAnswer(
    options: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> {
    return this.attemptRepository.submitAnswer(options);
  }

  async submitAttempt(
    options: SubmitAttemptRequest
  ): Promise<SubmitAttemptResponse> {
    return this.attemptRepository.submitAttempt(options);
  }

  async getAttemptResult(
    options: GetAttemptResultRequest
  ): Promise<GetAttemptResultResponse> {
    return this.attemptRepository.getAttemptResult(options);
  }

  async getAttemptHistory(
    options: GetAttemptHistoryRequest
  ): Promise<GetAttemptHistoryResponse> {
    return this.attemptRepository.getAttemptHistory(options);
  }

  // ── Analytics ──

  async getQuizAnalytics(
    options: GetQuizAnalyticsRequest
  ): Promise<GetQuizAnalyticsResponse> {
    return this.attemptRepository.getQuizAnalytics(options);
  }

  // ── Question picture upload ──

  async getQuestionPictureUploadUrl(
    options: GetQuestionPictureUploadUrlRequest
  ): Promise<GetQuestionPictureUploadUrlResponse> {
    return this.quizRepository.getQuestionPictureUploadUrl(options);
  }
}
