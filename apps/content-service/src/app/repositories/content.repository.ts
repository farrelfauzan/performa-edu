import { Injectable, Logger } from '@nestjs/common';
import { IContentRepository } from '../interfaces/content.repository.interface';
import {
  GetAllContentsRequest,
  GetAllContentsResponse,
  GetContentByIdRequest,
  GetContentByIdResponse,
  CreateContentRequest,
  CreateContentResponse,
  CreateContentWithSectionsRequest,
  CreateContentWithSectionsResponse,
  StartContentConversionRequest,
  StartContentConversionResponse,
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
import { ContentMediaRepository } from './content-media.repository';

@Injectable()
export class ContentRepository implements IContentRepository {
  private readonly logger = new Logger(ContentRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder,
    private readonly contentMediaRepository: ContentMediaRepository
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
          ...(options.categoryId && { categoryId: options.categoryId }),
          ...(options.year && { year: options.year }),
        },
        include: {
          contentMedias: true,
          category: true,
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
        year: options.year,
        categoryId: options.categoryId,
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

  async createContentWithSections(
    options: CreateContentWithSectionsRequest
  ): Promise<CreateContentWithSectionsResponse> {
    // Step 1: Create content + sections + media placeholders in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          userId: options.userId,
          title: options.title,
          body: options.body,
          year: options.year,
          categoryId: options.categoryId,
          status: Object.values(ContentStatusEnum)[options.status],
        },
      });

      for (const section of options.sections) {
        const createdSection = await tx.contentSection.create({
          data: {
            contentId: content.id,
            title: section.title,
            description: section.description,
            sortOrder: section.sortOrder,
          },
        });

        for (const video of section.videos) {
          await tx.contentMedia.create({
            data: {
              content: { connect: { id: content.id } },
              section: { connect: { id: createdSection.id } },
              mediaType: 'VIDEO',
              originalUrl: '',
              bucketName: '',
              objectPath: '',
              fileName: video.fileName,
              fileSize: BigInt(video.fileSize),
              mimeType: video.mimeType,
              sortOrder: video.sortOrder,
              processingStatus: 'PENDING',
            },
          });
        }
      }

      return tx.content.findUniqueOrThrow({
        where: { id: content.id },
        include: {
          sections: {
            include: { medias: true },
            orderBy: { sortOrder: 'asc' },
          },
          contentMedias: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    // Step 2: Get presigned upload URLs for each video media
    const videoMedias = result.contentMedias.filter(
      (m) => m.mediaType === 'VIDEO'
    );

    const uploadUrls = await Promise.all(
      videoMedias.map(async (media) => {
        const presigned = await this.contentMediaRepository.getUploadUrl(
          media.fileName,
          media.mimeType
        );

        // Store the S3 key on the media record
        await this.prisma.contentMedia.update({
          where: { id: media.id },
          data: { objectPath: presigned.s3_key },
        });

        return {
          mediaId: media.id,
          uploadUrl: presigned.upload_url,
          fields: presigned.fields,
          s3Key: presigned.s3_key,
          expiresIn: presigned.expires_in,
        };
      })
    );

    this.logger.log(
      `Content ${result.id} created with ${result.sections.length} sections and ${videoMedias.length} video slots`
    );

    return {
      content: transformResponse<Content>(result),
      sections: transformResponse(result.sections),
      uploadUrls,
    };
  }

  async startContentConversion(
    options: StartContentConversionRequest
  ): Promise<StartContentConversionResponse> {
    const content = await this.prisma.content.findUniqueOrThrow({
      where: { id: options.contentId },
      include: {
        contentMedias: {
          where: {
            mediaType: 'VIDEO',
            processingStatus: 'PENDING',
            deletedAt: null,
          },
        },
      },
    });

    const jobs = await Promise.all(
      content.contentMedias.map(async (media) => {
        const { jobId } = await this.contentMediaRepository.startConversion(
          media.id,
          media.objectPath,
          media.fileName,
          options.callbackUrl
        );
        return { mediaId: media.id, jobId };
      })
    );

    this.logger.log(
      `Started ${jobs.length} HLS conversion jobs for content ${options.contentId}`
    );

    return { jobs };
  }
}
