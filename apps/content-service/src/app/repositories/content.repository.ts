import { Injectable, Logger } from '@nestjs/common';
import { IContentRepository } from '../interfaces/content.repository.interface';
import {
  ContentStatus,
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

/**
 * Map DB status string to proto ContentStatus enum integer.
 */
const statusStringToProto: Record<string, ContentStatus> = {
  DRAFT: ContentStatus.DRAFT,
  PUBLISHED: ContentStatus.PUBLISHED,
  ARCHIVED: ContentStatus.ARCHIVED,
  WAITING_REVIEW: ContentStatus.WAITING_FOR_REVIEW,
};

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

    console.log('Raw content data:', content.data); // Debug log for raw data

    const meta: PageMeta = {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      count: content.count,
    };

    return {
      data: await Promise.all(
        transformResponse<ContentWithMedia[]>(content.data).map(async (c) => {
          if (c.thumbnailUrl && !c.thumbnailUrl.startsWith('http')) {
            c.thumbnailUrl = await this.contentMediaRepository.getCloudFrontUrl(
              c.thumbnailUrl
            );
          }
          c.status =
            statusStringToProto[c.status as unknown as string] ?? c.status;
          return c;
        })
      ),
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
        include: {
          category: true,
          sections: {
            where: { deletedAt: null },
            include: {
              medias: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          contentMedias: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }
    );

    if (!content) {
      ContentNotFoundError(options.id);
    }

    // Query document medias separately and generate CloudFront URLs
    const documentMedias = await this.prisma.contentMedia.findMany({
      where: {
        contentId: options.id,
        mediaType: 'DOCUMENT',
        deletedAt: null,
        objectPath: { not: '' },
      },
      select: { id: true, objectPath: true },
    });

    const downloadUrlMap = new Map<string, string>();
    await Promise.all(
      documentMedias.map(async (media) => {
        const url = await this.contentMediaRepository.getCloudFrontUrl(
          media.objectPath
        );
        downloadUrlMap.set(media.id, url);
      })
    );

    const transformed = transformResponse<Content>(content);

    // Attach download URLs to document medias within sections
    if (transformed.sections) {
      for (const section of transformed.sections) {
        if (section.medias) {
          for (const media of section.medias) {
            const url = downloadUrlMap.get(media.id);
            if (url) {
              media.downloadUrl = url;
            }
          }
        }
      }
    }

    // Generate presigned URL for thumbnail
    if (
      transformed.thumbnailUrl &&
      !transformed.thumbnailUrl.startsWith('http')
    ) {
      transformed.thumbnailUrl =
        await this.contentMediaRepository.getCloudFrontUrl(
          transformed.thumbnailUrl
        );
    }

    transformed.status =
      statusStringToProto[transformed.status as unknown as string] ??
      transformed.status;

    return { data: transformed };
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

        // Create DOCUMENT media placeholders for this section
        const documents = section.documents ?? [];
        for (const doc of documents) {
          await tx.contentMedia.create({
            data: {
              content: { connect: { id: content.id } },
              section: { connect: { id: createdSection.id } },
              mediaType: 'DOCUMENT',
              originalUrl: '',
              bucketName: '',
              objectPath: '',
              fileName: doc.fileName,
              fileSize: BigInt(doc.fileSize),
              mimeType: doc.mimeType,
              sortOrder: doc.sortOrder,
              processingStatus: 'COMPLETED', // Documents don't need processing
            },
          });
        }
      }

      // Create thumbnail media placeholder (IMAGE, no section)
      if (options.thumbnail) {
        await tx.contentMedia.create({
          data: {
            content: { connect: { id: content.id } },
            mediaType: 'IMAGE',
            originalUrl: '',
            bucketName: '',
            objectPath: '',
            fileName: options.thumbnail.fileName,
            fileSize: BigInt(options.thumbnail.fileSize),
            mimeType: options.thumbnail.mimeType,
            sortOrder: 0,
            processingStatus: 'PENDING',
          },
        });
      }

      // Create preview video media placeholder (VIDEO, no section)
      if (options.previewVideo) {
        await tx.contentMedia.create({
          data: {
            content: { connect: { id: content.id } },
            mediaType: 'VIDEO',
            originalUrl: '',
            bucketName: '',
            objectPath: '',
            fileName: options.previewVideo.fileName,
            fileSize: BigInt(options.previewVideo.fileSize),
            mimeType: options.previewVideo.mimeType,
            sortOrder: 0,
            processingStatus: 'PENDING',
          },
        });
      }

      return tx.content.findUniqueOrThrow({
        where: { id: content.id },
        include: {
          category: true,
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

    // Step 2: Get presigned upload URLs for each section video media
    const sectionVideoMedias = result.contentMedias.filter(
      (m) => m.mediaType === 'VIDEO' && m.sectionId !== null
    );

    const uploadUrls = await Promise.all(
      sectionVideoMedias.map(async (media) => {
        const presigned = await this.contentMediaRepository.getUploadUrl(
          media.fileName,
          media.mimeType
        );

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

    // Step 3: Get presigned upload URL for thumbnail (IMAGE, no section)
    let thumbnailUploadUrl: CreateContentWithSectionsResponse['thumbnailUploadUrl'] =
      undefined;
    if (options.thumbnail) {
      const thumbnailMedia = result.contentMedias.find(
        (m) => m.mediaType === 'IMAGE' && m.sectionId === null
      );
      if (thumbnailMedia) {
        const presigned =
          await this.contentMediaRepository.getThumbnailUploadUrl(
            thumbnailMedia.fileName,
            thumbnailMedia.mimeType
          );

        await this.prisma.contentMedia.update({
          where: { id: thumbnailMedia.id },
          data: { objectPath: presigned.s3_key },
        });

        // Store the S3 path as thumbnail URL on content (will be accessible after upload)
        await this.prisma.content.update({
          where: { id: result.id },
          data: { thumbnailUrl: presigned.s3_key },
        });

        thumbnailUploadUrl = {
          mediaId: thumbnailMedia.id,
          uploadUrl: presigned.upload_url,
          fields: presigned.fields,
          s3Key: presigned.s3_key,
          expiresIn: presigned.expires_in,
        };
      }
    }

    // Step 4: Get presigned upload URL for preview video (VIDEO, no section)
    let previewUploadUrl: CreateContentWithSectionsResponse['previewUploadUrl'] =
      undefined;
    if (options.previewVideo) {
      const previewMedia = result.contentMedias.find(
        (m) => m.mediaType === 'VIDEO' && m.sectionId === null
      );
      if (previewMedia) {
        const presigned = await this.contentMediaRepository.getUploadUrl(
          previewMedia.fileName,
          previewMedia.mimeType
        );

        await this.prisma.contentMedia.update({
          where: { id: previewMedia.id },
          data: { objectPath: presigned.s3_key },
        });

        previewUploadUrl = {
          mediaId: previewMedia.id,
          uploadUrl: presigned.upload_url,
          fields: presigned.fields,
          s3Key: presigned.s3_key,
          expiresIn: presigned.expires_in,
        };
      }
    }

    this.logger.log(
      `Content ${result.id} created with ${result.sections.length} sections, ${
        sectionVideoMedias.length
      } video slots, thumbnail: ${!!options.thumbnail}, preview: ${!!options.previewVideo}`
    );

    // Step 5: Get presigned upload URLs for document media
    const documentMedias = result.contentMedias.filter(
      (m) => m.mediaType === 'DOCUMENT' && m.sectionId !== null
    );

    const documentUploadUrls = await Promise.all(
      documentMedias.map(async (media) => {
        const presigned =
          await this.contentMediaRepository.getDocumentUploadUrl(
            media.fileName,
            media.mimeType
          );

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

    return {
      content: transformResponse<Content>(result),
      sections: transformResponse(result.sections),
      uploadUrls,
      thumbnailUploadUrl,
      previewUploadUrl,
      documentUploadUrls,
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
