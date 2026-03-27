import { Injectable } from '@nestjs/common';
import { IQuizRepository } from '../interfaces/quiz.interface';
import {
  DynamicQueryBuilder,
  PageMeta,
  PageMetaDto,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
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
  Question,
  GetQuestionPictureUploadUrlRequest,
  GetQuestionPictureUploadUrlResponse,
} from '@performa-edu/proto-types/quiz-service';
import {
  QuizNotFoundError,
  QuestionNotFoundError,
  QuizHasNoQuestionsError,
} from '../errors/quiz.errors';
import { QuestionType as PrismaQuestionType } from '@performa-edu/libs';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QuizRepository implements IQuizRepository {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder,
    private readonly configService: ConfigService
  ) {
    const region =
      this.configService.get<string>('AWS_REGION') || 'ap-southeast-1';
    this.bucketName =
      this.configService.get<string>('S3_BUCKET_NAME') || 'performa-assets';
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY'
        ),
      },
    });
  }

  private readonly quizInclude = {
    questions: {
      orderBy: { sortOrder: 'asc' as const },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' as const },
        },
      },
    },
  };

  private mapQuestionType(type: number): PrismaQuestionType {
    const map: Record<number, PrismaQuestionType> = {
      0: 'MULTIPLE_CHOICE' as PrismaQuestionType,
      1: 'TRUE_FALSE' as PrismaQuestionType,
      2: 'SHORT_ANSWER' as PrismaQuestionType,
      3: 'MULTI_SELECT' as PrismaQuestionType,
    };
    return map[type] || ('MULTIPLE_CHOICE' as PrismaQuestionType);
  }

  private transformQuiz(quiz: any): Quiz {
    const transformed = transformResponse<Quiz>(quiz);
    return {
      ...transformed,
      questionCount: quiz.questions?.length || 0,
    };
  }

  async createQuiz(options: CreateQuizRequest): Promise<CreateQuizResponse> {
    const quiz = await this.prisma.quiz.create({
      data: {
        userId: options.userId,
        title: options.title,
        ...(options.description ? { description: options.description } : {}),
        ...(options.timeLimitSecs !== undefined &&
        options.timeLimitSecs !== null
          ? { timeLimitSecs: options.timeLimitSecs }
          : {}),
        ...(options.passingScore !== undefined && options.passingScore !== null
          ? { passingScore: options.passingScore }
          : {}),
        ...(options.maxAttempts !== undefined && options.maxAttempts !== null
          ? { maxAttempts: options.maxAttempts }
          : {}),
        ...(options.shuffleQuestions !== undefined &&
        options.shuffleQuestions !== null
          ? { shuffleQuestions: options.shuffleQuestions }
          : {}),
        ...(options.questions && options.questions.length > 0
          ? {
              questions: {
                create: options.questions.map((q, idx) => ({
                  type: this.mapQuestionType(q.type as number),
                  text: q.text,
                  ...(q.explanation ? { explanation: q.explanation } : {}),
                  ...(q.pictureUrl ? { pictureUrl: q.pictureUrl } : {}),
                  points: q.points ?? 1,
                  sortOrder: q.sortOrder ?? idx,
                  options: {
                    create: (q.options || []).map((o, oIdx) => ({
                      text: o.text,
                      isCorrect: o.isCorrect,
                      sortOrder: o.sortOrder ?? oIdx,
                    })),
                  },
                })),
              },
            }
          : {}),
      },
      include: this.quizInclude,
    });

    return { quiz: this.transformQuiz(quiz) };
  }

  async getQuizById(id: string): Promise<{ data: Quiz }> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id, deletedAt: null },
      include: this.quizInclude,
    });

    if (!quiz) {
      QuizNotFoundError(id);
    }

    return { data: this.transformQuiz(quiz) };
  }

  async getAllQuizzes(
    options: GetAllQuizzesRequest
  ): Promise<{ data: Quiz[]; meta: PageMetaDto }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    const where: any = {
      userId: options.userId,
      deletedAt: null,
    };

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (options.isPublished !== undefined && options.isPublished !== null) {
      where.isPublished = options.isPublished;
    }

    const sortBy = options.sortBy || 'createdAt';
    const order = options.order === 1 ? 'desc' : 'asc';

    const [data, count] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        include: this.quizInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.quiz.count({ where }),
    ]);

    const meta: PageMeta = { page, pageSize, count };

    return {
      data: data.map((q) => this.transformQuiz(q)),
      meta,
    };
  }

  async updateQuiz(
    id: string,
    options: UpdateQuizRequest
  ): Promise<UpdateQuizResponse> {
    const existing = await this.prisma.quiz.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      QuizNotFoundError(id);
    }

    const quiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        ...(options.title !== undefined ? { title: options.title } : {}),
        ...(options.description !== undefined
          ? { description: options.description }
          : {}),
        ...(options.clearTimeLimit
          ? { timeLimitSecs: null }
          : options.timeLimitSecs !== undefined &&
            options.timeLimitSecs !== null
          ? { timeLimitSecs: options.timeLimitSecs }
          : {}),
        ...(options.passingScore !== undefined && options.passingScore !== null
          ? { passingScore: options.passingScore }
          : {}),
        ...(options.maxAttempts !== undefined && options.maxAttempts !== null
          ? { maxAttempts: options.maxAttempts }
          : {}),
        ...(options.shuffleQuestions !== undefined &&
        options.shuffleQuestions !== null
          ? { shuffleQuestions: options.shuffleQuestions }
          : {}),
      },
      include: this.quizInclude,
    });

    return { quiz: this.transformQuiz(quiz) };
  }

  async deleteQuiz(options: DeleteQuizRequest): Promise<DeleteQuizResponse> {
    const existing = await this.prisma.quiz.findFirst({
      where: { id: options.id, deletedAt: null },
    });

    if (!existing) {
      QuizNotFoundError(options.id);
    }

    await this.prisma.quiz.update({
      where: { id: options.id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Quiz deleted successfully' };
  }

  async publishQuiz(options: PublishQuizRequest): Promise<PublishQuizResponse> {
    const existing = await this.prisma.quiz.findFirst({
      where: { id: options.id, deletedAt: null },
      include: { _count: { select: { questions: true } } },
    });

    if (!existing) {
      QuizNotFoundError(options.id);
    }

    if (existing._count.questions === 0) {
      QuizHasNoQuestionsError(options.id);
    }

    const quiz = await this.prisma.quiz.update({
      where: { id: options.id },
      data: { isPublished: true },
      include: this.quizInclude,
    });

    return { quiz: this.transformQuiz(quiz) };
  }

  async unpublishQuiz(
    options: UnpublishQuizRequest
  ): Promise<UnpublishQuizResponse> {
    const existing = await this.prisma.quiz.findFirst({
      where: { id: options.id, deletedAt: null },
    });

    if (!existing) {
      QuizNotFoundError(options.id);
    }

    const quiz = await this.prisma.quiz.update({
      where: { id: options.id },
      data: { isPublished: false },
      include: this.quizInclude,
    });

    return { quiz: this.transformQuiz(quiz) };
  }

  // ── Question management ──

  async addQuestion(options: AddQuestionRequest): Promise<AddQuestionResponse> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: options.quizId, deletedAt: null },
    });

    if (!quiz) {
      QuizNotFoundError(options.quizId);
    }

    // Get next sort order if not provided
    const sortOrder =
      options.sortOrder ??
      (await this.prisma.question.count({
        where: { quizId: options.quizId },
      }));

    const question = await this.prisma.question.create({
      data: {
        quizId: options.quizId,
        type: this.mapQuestionType(options.type as number),
        text: options.text,
        ...(options.explanation ? { explanation: options.explanation } : {}),
        ...(options.pictureUrl ? { pictureUrl: options.pictureUrl } : {}),
        points: options.points ?? 1,
        sortOrder,
        options: {
          create: (options.options || []).map((o, idx) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            sortOrder: o.sortOrder ?? idx,
          })),
        },
      },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return {
      question: transformResponse<Question>(question as any),
    };
  }

  async updateQuestion(
    options: UpdateQuestionRequest
  ): Promise<UpdateQuestionResponse> {
    const question = await this.prisma.question.findFirst({
      where: { id: options.questionId, quizId: options.quizId },
    });

    if (!question) {
      QuestionNotFoundError(options.questionId);
    }

    // If options are provided, replace them all (delete + create)
    const updated = await this.prisma.$transaction(async (tx) => {
      if (options.options && options.options.length > 0) {
        await tx.questionOption.deleteMany({
          where: { questionId: options.questionId },
        });
      }

      return tx.question.update({
        where: { id: options.questionId },
        data: {
          ...(options.type !== undefined
            ? { type: this.mapQuestionType(options.type as number) }
            : {}),
          ...(options.text !== undefined ? { text: options.text } : {}),
          ...(options.explanation !== undefined
            ? { explanation: options.explanation }
            : {}),
          ...(options.pictureUrl !== undefined
            ? { pictureUrl: options.pictureUrl || null }
            : {}),
          ...(options.points !== undefined && options.points !== null
            ? { points: options.points }
            : {}),
          ...(options.options && options.options.length > 0
            ? {
                options: {
                  create: options.options.map((o, idx) => ({
                    text: o.text,
                    isCorrect: o.isCorrect,
                    sortOrder: o.sortOrder ?? idx,
                  })),
                },
              }
            : {}),
        },
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return {
      question: transformResponse<Question>(updated as any),
    };
  }

  async deleteQuestion(
    options: DeleteQuestionRequest
  ): Promise<DeleteQuestionResponse> {
    const question = await this.prisma.question.findFirst({
      where: { id: options.questionId, quizId: options.quizId },
    });

    if (!question) {
      QuestionNotFoundError(options.questionId);
    }

    await this.prisma.question.delete({
      where: { id: options.questionId },
    });

    return { message: 'Question deleted successfully' };
  }

  async reorderQuestions(
    options: ReorderQuestionsRequest
  ): Promise<ReorderQuestionsResponse> {
    await this.prisma.$transaction(
      options.questionIds.map((id, index) =>
        this.prisma.question.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return { message: 'Questions reordered successfully' };
  }

  // ── Question picture upload ──

  async getQuestionPictureUploadUrl(
    options: GetQuestionPictureUploadUrlRequest
  ): Promise<GetQuestionPictureUploadUrlResponse> {
    const question = await this.prisma.question.findFirst({
      where: { id: options.questionId, quizId: options.quizId },
    });

    if (!question) {
      QuestionNotFoundError(options.questionId);
    }

    const ext = options.filename.split('.').pop()?.toLowerCase() || 'jpg';
    const s3Key = `question-pictures/${
      options.questionId
    }/${Date.now()}.${ext}`;

    const presigned = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: s3Key,
      Conditions: [
        { 'Content-Type': options.contentType },
        ['content-length-range', 1, 5 * 1024 * 1024], // max 5MB
      ],
      Fields: {
        'Content-Type': options.contentType,
      },
      Expires: 3600,
    });

    const publicUrl = `https://dv0u9v99guak9.cloudfront.net/${s3Key}`;

    return {
      uploadUrl: presigned.url,
      fields: presigned.fields,
      s3Key,
      publicUrl,
      expiresIn: 3600,
    };
  }
}
