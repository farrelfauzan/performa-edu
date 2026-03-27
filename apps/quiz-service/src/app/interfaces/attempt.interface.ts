import { PageMetaDto } from '@performa-edu/libs';
import {
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
} from '@performa-edu/proto-types/quiz-service';

export interface IAttemptRepository {
  startAttempt(options: StartAttemptRequest): Promise<StartAttemptResponse>;
  submitAnswer(options: SubmitAnswerRequest): Promise<SubmitAnswerResponse>;
  submitAttempt(options: SubmitAttemptRequest): Promise<SubmitAttemptResponse>;
  getAttemptResult(
    options: GetAttemptResultRequest
  ): Promise<GetAttemptResultResponse>;
  getAttemptHistory(
    options: GetAttemptHistoryRequest
  ): Promise<GetAttemptHistoryResponse>;
  getQuizAnalytics(
    options: GetQuizAnalyticsRequest
  ): Promise<GetQuizAnalyticsResponse>;
}
