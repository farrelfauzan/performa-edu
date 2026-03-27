import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export function QuizNotFoundError(id: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Quiz with id "${id}" not found`,
  });
}

export function QuestionNotFoundError(questionId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Question with id "${questionId}" not found`,
  });
}

export function QuizNotPublishedError(id: string) {
  throw new RpcException({
    code: status.FAILED_PRECONDITION,
    message: `Quiz "${id}" is not published`,
  });
}

export function MaxAttemptsExceededError(quizId: string, max: number) {
  throw new RpcException({
    code: status.FAILED_PRECONDITION,
    message: `Maximum attempts (${max}) exceeded for quiz "${quizId}"`,
  });
}

export function AttemptNotFoundError(attemptId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Attempt with id "${attemptId}" not found`,
  });
}

export function AttemptAlreadySubmittedError(attemptId: string) {
  throw new RpcException({
    code: status.FAILED_PRECONDITION,
    message: `Attempt "${attemptId}" has already been submitted`,
  });
}

export function QuizHasNoQuestionsError(quizId: string) {
  throw new RpcException({
    code: status.FAILED_PRECONDITION,
    message: `Quiz "${quizId}" has no questions and cannot be published`,
  });
}
