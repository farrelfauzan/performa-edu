import { Injectable } from '@nestjs/common';
import { PrismaService, transformResponse } from '@performa-edu/libs';
import {
  UpdateProgressRequest,
  UpdateProgressResponse,
  GetProgressLogsRequest,
  GetProgressLogsResponse,
  ProgressLog,
  Assignment,
  ProgressAction,
} from '@performa-edu/proto-types/student-service';
import {
  AssignmentNotFoundError,
  InvalidProgressActionError,
} from '../errors/student.errors';
import { ProgressAction as PrismaProgressAction } from '@performa-edu/libs';

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async updateProgress(
    options: UpdateProgressRequest
  ): Promise<UpdateProgressResponse> {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        studentId_contentId: {
          studentId: options.studentId,
          contentId: options.contentId,
        },
      },
    });

    if (!assignment) {
      AssignmentNotFoundError(options.studentId, options.contentId);
    }

    // Validate required fields based on action
    if (
      options.action === ProgressAction.COMPLETE_SECTION &&
      !options.sectionId
    ) {
      InvalidProgressActionError(
        'sectionId is required for COMPLETE_SECTION action'
      );
    }
    if (
      options.action === ProgressAction.ANSWER_QUESTION &&
      !options.questionId
    ) {
      InvalidProgressActionError(
        'questionId is required for ANSWER_QUESTION action'
      );
    }

    // Check if already logged (idempotent)
    const existingLog = await this.findExistingLog(
      assignment.id,
      options.action,
      options.sectionId,
      options.questionId
    );

    if (existingLog) {
      return {
        assignment: transformResponse<Assignment>(assignment as any),
        alreadyLogged: true,
      };
    }

    // Create progress log
    await this.prisma.progressLog.create({
      data: {
        assignmentId: assignment.id,
        action: this.mapActionToDb(options.action),
        ...(options.sectionId ? { sectionId: options.sectionId } : {}),
        ...(options.questionId ? { questionId: options.questionId } : {}),
      },
    });

    // Recalculate progress
    const completedItems = await this.prisma.progressLog.count({
      where: { assignmentId: assignment.id },
    });

    // Get total sections for this content (via content sections count)
    // For now, calculate based on completed items — total items will be refined
    // when content-service integration is added
    const totalSections = await this.getTotalItemsForContent(
      options.contentId
    );
    const progress =
      totalSections > 0
        ? Math.min((completedItems / totalSections) * 100, 100)
        : 0;

    // Update assignment
    const isFirstProgress =
      assignment.status === 'ASSIGNED' ||
      (assignment.status as string) === 'ASSIGNED';

    const updatedAssignment = await this.prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        progress,
        ...(isFirstProgress
          ? { status: 'IN_PROGRESS', startedAt: new Date() }
          : {}),
        ...(progress >= 100
          ? { status: 'COMPLETED', completedAt: new Date() }
          : {}),
      },
      include: { student: true },
    });

    return {
      assignment: transformResponse<Assignment>(updatedAssignment as any),
      alreadyLogged: false,
    };
  }

  async getProgressLogs(
    options: GetProgressLogsRequest
  ): Promise<GetProgressLogsResponse> {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: options.assignmentId },
    });

    if (!assignment) {
      AssignmentNotFoundError(options.assignmentId, '');
    }

    const logs = await this.prisma.progressLog.findMany({
      where: { assignmentId: options.assignmentId },
      orderBy: { createdAt: 'asc' },
    });

    const totalItems = await this.getTotalItemsForContent(
      assignment.contentId
    );
    const completedItems = logs.length;
    const progress =
      totalItems > 0
        ? Math.min((completedItems / totalItems) * 100, 100)
        : 0;

    return {
      logs: transformResponse<ProgressLog[]>(logs as any),
      progress,
      completedItems,
      totalItems,
    };
  }

  private async findExistingLog(
    assignmentId: string,
    action: ProgressAction,
    sectionId?: string,
    questionId?: string
  ) {
    const dbAction = this.mapActionToDb(action);

    if (action === ProgressAction.COMPLETE_SECTION && sectionId) {
      return this.prisma.progressLog.findUnique({
        where: {
          assignmentId_sectionId_action: {
            assignmentId,
            sectionId,
            action: dbAction,
          },
        },
      });
    }

    if (action === ProgressAction.ANSWER_QUESTION && questionId) {
      return this.prisma.progressLog.findUnique({
        where: {
          assignmentId_questionId_action: {
            assignmentId,
            questionId,
            action: dbAction,
          },
        },
      });
    }

    return null;
  }

  private async getTotalItemsForContent(contentId: string): Promise<number> {
    // Count content sections as total trackable items
    const sectionCount = await this.prisma.contentSection.count({
      where: { contentId, deletedAt: null },
    });

    // Future: add quiz question count when quiz-service is implemented
    return sectionCount;
  }

  private mapActionToDb(action: ProgressAction): PrismaProgressAction {
    const map: Record<number, PrismaProgressAction> = {
      [ProgressAction.COMPLETE_SECTION]: 'COMPLETE_SECTION' as PrismaProgressAction,
      [ProgressAction.ANSWER_QUESTION]: 'ANSWER_QUESTION' as PrismaProgressAction,
    };
    return map[action] || ('COMPLETE_SECTION' as PrismaProgressAction);
  }
}
