import { Injectable, Logger } from '@nestjs/common';
import {
  BulkUploadItem,
  IContentMediaRepository,
  UploadFile,
} from '../interfaces/content-media.repository.interface';
import {
  CDN_BASE_URL,
  HlsConverterClient,
  PresignedUploadResponse,
  PrismaService,
} from '@performa-edu/libs';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class ContentMediaRepository implements IContentMediaRepository {
  private readonly hlsClient: HlsConverterClient;
  private readonly logger = new Logger(ContentMediaRepository.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.hlsClient = new HlsConverterClient({
      baseUrl: process.env.HLS_CONVERTER_URL || 'http://localhost:3001',
      apiKey: process.env.HLS_CONVERTER_API_KEY || '',
    });

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

      // If this is a preview video (VIDEO with no section), update Content.previewUrl
      if (
        contentMedia.mediaType === 'VIDEO' &&
        contentMedia.sectionId === null &&
        masterPlaylistUrl
      ) {
        await this.prisma.content.update({
          where: { id: contentMedia.contentId },
          data: { previewUrl: masterPlaylistUrl },
        });
        this.logger.log(`Updated Content ${contentMedia.contentId} previewUrl`);
      }

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

  /**
   * Get a presigned POST URL for uploading a thumbnail directly to S3.
   * Thumbnails are stored as-is (no HLS conversion).
   */
  async getThumbnailUploadUrl(
    fileName: string,
    mimeType: string
  ): Promise<{
    upload_url: string;
    fields: Record<string, string>;
    s3_key: string;
    expires_in: number;
  }> {
    const s3Key = `thumbnails/${randomUUID()}/${fileName}`;

    const presigned = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: s3Key,
      Conditions: [
        ['content-length-range', 0, 10 * 1024 * 1024], // max 10MB
        ['starts-with', '$Content-Type', ''],
      ],
      Fields: {
        'Content-Type': mimeType,
      },
      Expires: 3600,
    });

    return {
      upload_url: presigned.url,
      fields: presigned.fields,
      s3_key: s3Key,
      expires_in: 3600,
    };
  }

  /**
   * Get a presigned POST URL for uploading a document directly to S3.
   * Documents are stored as-is (no HLS conversion).
   */
  async getDocumentUploadUrl(
    fileName: string,
    mimeType: string
  ): Promise<{
    upload_url: string;
    fields: Record<string, string>;
    s3_key: string;
    expires_in: number;
  }> {
    const s3Key = `documents/${randomUUID()}/${fileName}`;

    const presigned = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: s3Key,
      Conditions: [
        ['content-length-range', 0, 100 * 1024 * 1024], // max 100MB
        ['starts-with', '$Content-Type', ''],
      ],
      Fields: {
        'Content-Type': mimeType,
      },
      Expires: 3600,
    });

    return {
      upload_url: presigned.url,
      fields: presigned.fields,
      s3_key: s3Key,
      expires_in: 3600,
    };
  }

  /**
   * Get a public CloudFront URL for a given S3 key.
   */
  getCloudFrontUrl(s3Key: string): string {
    return `${CDN_BASE_URL}/${s3Key}`;
  }

  /**
   * @deprecated Use getCloudFrontUrl instead
   */
  async getPresignedGetUrl(s3Key: string): Promise<string> {
    return this.getCloudFrontUrl(s3Key);
  }
}
