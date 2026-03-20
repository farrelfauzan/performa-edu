import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';

export class StorageClient {
  private readonly BASE_URL: string;
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('AWS_REGION') || 'ap-southeast-1';

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY'
        ),
      },
    });

    this.bucketName = this.configService.getOrThrow<string>('S3_BUCKET_NAME');
    this.BASE_URL = `https://${this.bucketName}.s3.${region}.amazonaws.com`;
  }

  async uploadBuffer(buffer: Buffer, objectName: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectName,
        Body: buffer,
      })
    );
  }

  async uploadFile(destination: string, sourceFilePath: string): Promise<void> {
    const body = await readFile(sourceFilePath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: destination,
        Body: body,
      })
    );
  }

  async deleteFile(filePath: string): Promise<void> {
    if (filePath.startsWith(this.BASE_URL)) {
      const baseUrl = this.BASE_URL.endsWith('/')
        ? this.BASE_URL
        : `${this.BASE_URL}/`;
      filePath = filePath.replace(baseUrl, '');
    }

    if (filePath.startsWith(this.bucketName)) {
      const bucketName = this.bucketName.endsWith('/')
        ? this.bucketName
        : `${this.bucketName}/`;
      filePath = filePath.replace(bucketName, '');
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      })
    );
  }

  getPublicUrl(objectName: string): string {
    return `${this.BASE_URL}/${objectName}`;
  }
}

/**
 * @deprecated Use StorageClient instead
 */
export const Minio = StorageClient;
