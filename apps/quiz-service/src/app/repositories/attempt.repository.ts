import { Injectable } from '@nestjs/common';
import { IAttemptRepository } from '../interfaces/attempt.interface';
import { PageMeta, PrismaService, transformResponse } from '@performa-edu/libs';
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
  QuizAttempt,
  AttemptQuestion,
  AttemptAnswerResult,
  QuestionStat,
  AttemptStatus,
} from '@performa-edu/proto-types/quiz-service';
import {
  QuizNotFoundError,
  QuizNotPublishedError,
  MaxAttemptsExceededError,
  AttemptNotFoundError,
  AttemptAlreadySubmittedError,
} from '../errors/quiz.errors';
import { AttemptStatus as PrismaAttemptStatus } from '@performa-edu/libs';

@Injectable()
export class AttemptRepository implements IAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async startAttempt(
    options: StartAttemptRequest
  ): Promise<StartAttemptResponse> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: options.quizId, deletedAt: null },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!quiz) {
      QuizNotFoundError(options.quizId);
    }

    if (!quiz.isPublished) {
      QuizNotPublishedError(options.quizId);
    }

    // Check attempt count
    const attemptCount = await this.prisma.quizAttempt.count({
      where: {
        quizId: options.quizId,
        userId: options.userId,
        status: { not: 'IN_PROGRESS' as PrismaAttemptStatus },
      },
    });

    if (attemptCount >= quiz.maxAttempts) {
      MaxAttemptsExceededError(options.quizId, quiz.maxAttempts);
    }

    // Check for existing in-progress attempt
    const existingAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quizId: options.quizId,
        userId: options.userId,
        status: 'IN_PROGRESS' as PrismaAttemptStatus,
      },
    });

    const attempt =
      existingAttempt ||
      (await this.prisma.quizAttempt.create({
        data: {
          quizId: options.quizId,
          userId: options.userId,
        },
      }));

    // Prepare questions (without correct answers)
    let questions = quiz.questions;
    if (quiz.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    const attemptQuestions: AttemptQuestion[] = questions.map((q) => ({
      id: q.id,
      type: q.type as unknown as number,
      text: q.text,
      points: q.points,
      sortOrder: q.sortOrder,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        sortOrder: o.sortOrder,
      })),
    }));

    return {
      attempt: transformResponse<QuizAttempt>(attempt as any),
      questions: attemptQuestions,
    };
  }

  async submitAnswer(
    options: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: options.attemptId },
    });

    if (!attempt) {
      AttemptNotFoundError(options.attemptId);
    }

    if (attempt.status !== ('IN_PROGRESS' as PrismaAttemptStatus)) {
      AttemptAlreadySubmittedError(options.attemptId);
    }

    // Upsert the answer
    await this.prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: options.attemptId,
          questionId: options.questionId,
        },
      },
      update: {
        selectedOptions: options.selectedOptionIds,
        ...(options.textAnswer ? { textAnswer: options.textAnswer } : {}),
      },
      create: {
        attemptId: options.attemptId,
        questionId: options.questionId,
        selectedOptions: options.selectedOptionIds,
        ...(options.textAnswer ? { textAnswer: options.textAnswer } : {}),
      },
    });

    return { message: 'Answer saved' };
  }

  async submitAttempt(
    options: SubmitAttemptRequest
  ): Promise<SubmitAttemptResponse> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: options.attemptId },
      include: {
        answers: true,
        quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      AttemptNotFoundError(options.attemptId);
    }

    if (attempt.status !== ('IN_PROGRESS' as PrismaAttemptStatus)) {
      AttemptAlreadySubmittedError(options.attemptId);
    }

    // Grade each answer
    let totalScore = 0;
    let totalPoints = 0;

    for (const question of attempt.quiz.questions) {
      totalPoints += question.points;

      const answer = attempt.answers.find((a) => a.questionId === question.id);

      if (!answer) continue;

      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();

      const selectedIds = [...answer.selectedOptions].sort();

      const isCorrect =
        correctOptionIds.length === selectedIds.length &&
        correctOptionIds.every((id, i) => id === selectedIds[i]);

      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      await this.prisma.attemptAnswer.update({
        where: { id: answer.id },
        data: { isCorrect, pointsEarned },
      });
    }

    const score = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;

    const updated = await this.prisma.quizAttempt.update({
      where: { id: options.attemptId },
      data: {
        status: 'SUBMITTED' as PrismaAttemptStatus,
        score,
        totalPoints,
        submittedAt: new Date(),
      },
    });

    return {
      attempt: transformResponse<QuizAttempt>(updated as any),
    };
  }

  async getAttemptResult(
    options: GetAttemptResultRequest
  ): Promise<GetAttemptResultResponse> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: options.attemptId },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      AttemptNotFoundError(options.attemptId);
    }

    const answers: AttemptAnswerResult[] = attempt.answers.map((a) => ({
      questionId: a.questionId,
      questionText: a.question.text,
      questionType: a.question.type as unknown as number,
      selectedOptionIds: a.selectedOptions,
      textAnswer: a.textAnswer || undefined,
      isCorrect: a.isCorrect,
      pointsEarned: a.pointsEarned,
      maxPoints: a.question.points,
      explanation: a.question.explanation || undefined,
      correctOptions: a.question.options
        .filter((o) => o.isCorrect)
        .map((o) => transformResponse(o as any)),
    }));

    return {
      attempt: transformResponse<QuizAttempt>(attempt as any),
      answers,
    };
  }

  async getAttemptHistory(
    options: GetAttemptHistoryRequest
  ): Promise<GetAttemptHistoryResponse> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    const where: any = { quizId: options.quizId };
    if (options.userId) {
      where.userId = options.userId;
    }

    const [data, count] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.quizAttempt.count({ where }),
    ]);

    const meta: PageMeta = { page, pageSize, count };

    return {
      attempts: data.map((a) => transformResponse<QuizAttempt>(a as any)),
      meta,
    };
  }

  async getQuizAnalytics(
    options: GetQuizAnalyticsRequest
  ): Promise<GetQuizAnalyticsResponse> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: options.quizId, deletedAt: null },
      include: {
        questions: true,
        attempts: {
          where: { status: { not: 'IN_PROGRESS' as PrismaAttemptStatus } },
          include: { answers: true },
        },
      },
    });

    if (!quiz) {
      QuizNotFoundError(options.quizId);
    }

    const submittedAttempts = quiz.attempts;
    const totalAttempts = submittedAttempts.length;

    const averageScore =
      totalAttempts > 0
        ? submittedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
          totalAttempts
        : 0;

    const passRate =
      totalAttempts > 0
        ? (submittedAttempts.filter((a) => (a.score || 0) >= quiz.passingScore)
            .length /
            totalAttempts) *
          100
        : 0;

    const questionStats: QuestionStat[] = quiz.questions.map((q) => {
      const allAnswers = submittedAttempts.flatMap((a) =>
        a.answers.filter((ans) => ans.questionId === q.id)
      );
      const total = allAnswers.length;

      return {
        questionId: q.id,
        text: q.text,
        correctRate:
          total > 0
            ? (allAnswers.filter((a) => a.isCorrect).length / total) * 100
            : 0,
        averagePoints:
          total > 0
            ? allAnswers.reduce((sum, a) => sum + a.pointsEarned, 0) / total
            : 0,
      };
    });

    return {
      quizId: options.quizId,
      totalAttempts,
      averageScore,
      passRate,
      questionStats,
    };
  }
}
