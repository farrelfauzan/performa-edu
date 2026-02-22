import { Injectable } from '@nestjs/common';
import { IContentRepository } from '../interfaces/content.repository.interface';
import {
  GetAllContentsRequest,
  GetAllContentsResponse,
  GetContentByIdRequest,
  GetContentByIdResponse,
  CreateContentRequest,
  CreateContentResponse,
  UpdateContentRequest,
  UpdateContentResponse,
  DeleteContentRequest,
  DeleteContentResponse,
} from '@performa-edu/proto-types/content-service';
import {
  Content,
  ContentStatusEnum,
  ContentWithMedia,
  DynamicQueryBuilder,
  PageMeta,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import { ContentNotFoundError } from '../error/content.error';

@Injectable()
export class ContentRepository implements IContentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder
  ) {}

  async getAllContents(options: GetAllContentsRequest): Promise<{
    data: GetAllContentsResponse['contents'];
    meta: GetAllContentsResponse['pageMeta'];
  }> {
    const content = await this.dynamicQueryBuilder.buildDynamicQuery(
      'Content',
      {
        ...options,
        where: {
          deletedAt: null,
        },
        include: {
          contentMedias: true,
        },
      }
    );

    const meta: PageMeta = {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      count: content.count,
    };

    return {
      data: transformResponse<ContentWithMedia[]>(content.data),
      meta,
    };
  }

  async getContentById(
    options: GetContentByIdRequest
  ): Promise<{ data: GetContentByIdResponse['content'] }> {
    const content = await this.prisma.findFirstActive<Content>(
      this.prisma.content,
      {
        where: { id: options.id },
      }
    );

    if (!content) {
      ContentNotFoundError(options.id);
    }

    return { data: transformResponse<Content>(content) };
  }

  async createContent(
    options: CreateContentRequest
  ): Promise<{ data: CreateContentResponse['content'] }> {
    const content = await this.prisma.content.create({
      data: {
        userId: options.userId,
        title: options.title,
        body: options.body,
        status: Object.values(ContentStatusEnum)[options.status],
      },
    });

    return { data: transformResponse<Content>(content) };
  }

  async updateContent(
    options: UpdateContentRequest
  ): Promise<{ data: UpdateContentResponse['content'] }> {
    const findContent = await this.prisma.findFirstActive<Content>(
      this.prisma.content,
      {
        where: { id: options.id },
      }
    );

    if (!findContent) {
      ContentNotFoundError(options.id);
    }

    const content = await this.prisma.content.update({
      where: { id: options.id },
      data: {
        title: options.title,
        body: options.body,
      },
    });

    return { data: transformResponse<Content>(content) };
  }

  async deleteContent(
    options: DeleteContentRequest
  ): Promise<DeleteContentResponse> {
    const content = await this.prisma.findFirstActive<Content>(
      this.prisma.content,
      {
        where: { id: options.id },
      }
    );

    if (!content) {
      ContentNotFoundError(options.id);
    }

    await this.prisma.softDelete<Content>(this.prisma.content, {
      id: options.id,
    });

    return { message: 'Content deleted successfully' };
  }
}
