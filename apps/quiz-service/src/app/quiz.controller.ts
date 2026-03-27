import { Controller } from '@nestjs/common';
import { QuizService } from './quiz.service';
import {
  QuizServiceController,
  QuizServiceControllerMethods,
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

@Controller()
@QuizServiceControllerMethods()
export class QuizController implements QuizServiceController {
  constructor(private readonly quizService: QuizService) {}

  // ── Quiz CRUD ──

  async createQuiz(options: CreateQuizRequest): Promise<CreateQuizResponse> {
    return this.quizService.createQuiz(options);
  }

  async getQuizById(options: GetQuizByIdRequest): Promise<GetQuizByIdResponse> {
    return this.quizService.getQuizById(options);
  }

  async updateQuiz(options: UpdateQuizRequest): Promise<UpdateQuizResponse> {
    return this.quizService.updateQuiz(options);
  }

  async deleteQuiz(options: DeleteQuizRequest): Promise<DeleteQuizResponse> {
    return this.quizService.deleteQuiz(options);
  }

  async getAllQuizzes(
    options: GetAllQuizzesRequest
  ): Promise<GetAllQuizzesResponse> {
    return this.quizService.getAllQuizzes(options);
  }

  async publishQuiz(options: PublishQuizRequest): Promise<PublishQuizResponse> {
    return this.quizService.publishQuiz(options);
  }

  async unpublishQuiz(
    options: UnpublishQuizRequest
  ): Promise<UnpublishQuizResponse> {
    return this.quizService.unpublishQuiz(options);
  }

  // ── Question management ──

  async addQuestion(options: AddQuestionRequest): Promise<AddQuestionResponse> {
    return this.quizService.addQuestion(options);
  }

  async updateQuestion(
    options: UpdateQuestionRequest
  ): Promise<UpdateQuestionResponse> {
    return this.quizService.updateQuestion(options);
  }

  async deleteQuestion(
    options: DeleteQuestionRequest
  ): Promise<DeleteQuestionResponse> {
    return this.quizService.deleteQuestion(options);
  }

  async reorderQuestions(
    options: ReorderQuestionsRequest
  ): Promise<ReorderQuestionsResponse> {
    return this.quizService.reorderQuestions(options);
  }

  // ── Attempts ──

  async startAttempt(
    options: StartAttemptRequest
  ): Promise<StartAttemptResponse> {
    return this.quizService.startAttempt(options);
  }

  async submitAnswer(
    options: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> {
    return this.quizService.submitAnswer(options);
  }

  async submitAttempt(
    options: SubmitAttemptRequest
  ): Promise<SubmitAttemptResponse> {
    return this.quizService.submitAttempt(options);
  }

  async getAttemptResult(
    options: GetAttemptResultRequest
  ): Promise<GetAttemptResultResponse> {
    return this.quizService.getAttemptResult(options);
  }

  async getAttemptHistory(
    options: GetAttemptHistoryRequest
  ): Promise<GetAttemptHistoryResponse> {
    return this.quizService.getAttemptHistory(options);
  }

  // ── Analytics ──

  async getQuizAnalytics(
    options: GetQuizAnalyticsRequest
  ): Promise<GetQuizAnalyticsResponse> {
    return this.quizService.getQuizAnalytics(options);
  }

  async getQuestionPictureUploadUrl(
    options: GetQuestionPictureUploadUrlRequest
  ): Promise<GetQuestionPictureUploadUrlResponse> {
    return this.quizService.getQuestionPictureUploadUrl(options);
  }
}
