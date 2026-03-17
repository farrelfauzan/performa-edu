import { Injectable, Logger } from '@nestjs/common';
import {
  BulkUploadItem,
  IContentMediaRepository,
  UploadFile,
} from '../interfaces/content-media.repository.interface';
import {
  HlsConverterClient,
  PresignedUploadResponse,
  PrismaService,
} from '@performa-edu/libs';

@Injectable()
export class ContentMediaRepository implements IContentMediaRepository {
  private readonly hlsClient: HlsConverterClient;
  private readonly logger = new Logger(ContentMediaRepository.name);

  constructor(private readonly prisma: PrismaService) {
    this.hlsClient = new HlsConverterClient({
      baseUrl: process.env.HLS_CONVERTER_URL || 'http://localhost:3001',
    });
  }

  async getUploadUrl(
    filename: string,
    contentType: string
  ): Promise<PresignedUploadResponse> {
    return this.hlsClient.getUploadUrl({
      filename,
      content_type: contentType,
    });
  }

  async getBulkUploadUrls(
    files: { filename: string; contentType: string }[]
  ): Promise<PresignedUploadResponse[]> {
    return Promise.all(
      files.map((f) =>
        this.hlsClient.getUploadUrl({
          filename: f.filename,
          content_type: f.contentType,
        })
      )
    );
  }

  async uploadAndConvertToHLS(
    contentMediaId: string,
    file: UploadFile,
    callbackUrl?: string
  ): Promise<{ jobId: string }> {
    // 1. Mark as PROCESSING
    await this.prisma.contentMedia.update({
      where: { id: contentMediaId },
      data: { processingStatus: 'PROCESSING' },
    });

    // 2. Get presigned upload URL from HLS converter service
    const presigned = await this.hlsClient.getUploadUrl({
      filename: file.originalname,
      content_type: file.mimetype,
    });

    // 3. Upload file to S3 via presigned URL
    await this.hlsClient.uploadFile(presigned, Buffer.from(file.buffer));

    // 4. Start HLS conversion job
    const conversion = await this.hlsClient.convert({
      s3_key: presigned.s3_key,
      original_filename: file.originalname,
      callback_url: callbackUrl,
    });

    // 5. Store the S3 key in DB for reference
    await this.prisma.contentMedia.update({
      where: { id: contentMediaId },
      data: {
        objectPath: presigned.s3_key,
        fileName: file.originalname,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
      },
    });

    this.logger.log(
      `HLS conversion started for media ${contentMediaId}, jobId: ${conversion.job_id}`
    );

    return { jobId: conversion.job_id };
  }

  async bulkUploadAndConvertToHLS(
    items: BulkUploadItem[],
    callbackUrl?: string
  ): Promise<{ jobId: string; contentMediaId: string }[]> {
    const results = await Promise.all(
      items.map(async (item) => {
        const { jobId } = await this.uploadAndConvertToHLS(
          item.contentMediaId,
          item.file,
          callbackUrl
        );
        return { jobId, contentMediaId: item.contentMediaId };
      })
    );

    this.logger.log(`Bulk HLS conversion started for ${results.length} files`);

    return results;
  }

  async startConversion(
    contentMediaId: string,
    s3Key: string,
    originalFilename: string,
    callbackUrl?: string
  ): Promise<{ jobId: string }> {
    await this.prisma.contentMedia.update({
      where: { id: contentMediaId },
      data: { processingStatus: 'PROCESSING' },
    });

    const conversion = await this.hlsClient.convert({
      s3_key: s3Key,
      original_filename: originalFilename,
      callback_url: callbackUrl,
    });

    this.logger.log(
      `HLS conversion started for media ${contentMediaId}, jobId: ${conversion.job_id}`
    );

    return { jobId: conversion.job_id };
  }

  async handleConversionCallback(
    jobId: string,
    status: 'completed' | 'failed',
    masterPlaylistUrl: string | null,
    errorMessage: string | null
  ): Promise<void> {
    // Find the content media by the stored object path from the job
    const job = await this.hlsClient.getJob(jobId);

    const contentMedia = await this.prisma.contentMedia.findFirst({
      where: { objectPath: job.source_s3_key, deletedAt: null },
    });

    if (!contentMedia) {
      this.logger.warn(
        `No content media found for job ${jobId} (s3_key: ${job.source_s3_key})`
      );
      return;
    }

    if (status === 'completed') {
      await this.prisma.contentMedia.update({
        where: { id: contentMedia.id },
        data: {
          hlsUrl: masterPlaylistUrl,
          processingStatus: 'COMPLETED',
          processedAt: new Date(),
        },
      });
      this.logger.log(`HLS conversion completed for media ${contentMedia.id}`);
    } else {
      await this.prisma.contentMedia.update({
        where: { id: contentMedia.id },
        data: {
          processingStatus: 'FAILED',
        },
      });
      this.logger.error(
        `HLS conversion failed for media ${contentMedia.id}: ${errorMessage}`
      );
    }
  }
}
