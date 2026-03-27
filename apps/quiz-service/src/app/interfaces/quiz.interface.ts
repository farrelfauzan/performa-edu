import { PageMetaDto } from '@performa-edu/libs';
import {
  CreateQuizRequest,
  CreateQuizResponse,
  GetAllQuizzesRequest,
  Quiz,
  UpdateQuizRequest,
  UpdateQuizResponse,
  DeleteQuizRequest,
  DeleteQuizResponse,
  AddQuestionRequest,
  AddQuestionResponse,
  UpdateQuestionRequest,
  UpdateQuestionResponse,
  DeleteQuestionRequest,
  DeleteQuestionResponse,
  ReorderQuestionsRequest,
  ReorderQuestionsResponse,
  PublishQuizRequest,
  PublishQuizResponse,
  UnpublishQuizRequest,
  UnpublishQuizResponse,
  GetQuestionPictureUploadUrlRequest,
  GetQuestionPictureUploadUrlResponse,
} from '@performa-edu/proto-types/quiz-service';

export interface IQuizRepository {
  createQuiz(options: CreateQuizRequest): Promise<CreateQuizResponse>;
  getQuizById(id: string): Promise<{ data: Quiz }>;
  getAllQuizzes(
    options: GetAllQuizzesRequest
  ): Promise<{ data: Quiz[]; meta: PageMetaDto }>;
  updateQuiz(
    id: string,
    options: UpdateQuizRequest
  ): Promise<UpdateQuizResponse>;
  deleteQuiz(options: DeleteQuizRequest): Promise<DeleteQuizResponse>;
  publishQuiz(options: PublishQuizRequest): Promise<PublishQuizResponse>;
  unpublishQuiz(options: UnpublishQuizRequest): Promise<UnpublishQuizResponse>;
  addQuestion(options: AddQuestionRequest): Promise<AddQuestionResponse>;
  updateQuestion(
    options: UpdateQuestionRequest
  ): Promise<UpdateQuestionResponse>;
  deleteQuestion(
    options: DeleteQuestionRequest
  ): Promise<DeleteQuestionResponse>;
  reorderQuestions(
    options: ReorderQuestionsRequest
  ): Promise<ReorderQuestionsResponse>;
  getQuestionPictureUploadUrl(
    options: GetQuestionPictureUploadUrlRequest
  ): Promise<GetQuestionPictureUploadUrlResponse>;
}
