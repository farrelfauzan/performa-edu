import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

export class Minio {
  private readonly BASE_URL: string;
  private readonly client: Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const minioEnvUseSSL: string | null | undefined =
      this.configService.get<string>('MINIO_USE_SSL');

    let useSSL: boolean = false;

    if (minioEnvUseSSL)
      if (['true', '1', 'yes'].includes(minioEnvUseSSL.toLowerCase())) {
        useSSL = true;
      }

    this.client = new Client({
      endPoint: this.configService.get<string>('MINIO_HOST')!,
      port: this.configService.get<number>('MINIO_PORT')!,
      useSSL,
      accessKey: this.configService.get<string>('MINIO_USER')!,
      secretKey: this.configService.get<string>('MINIO_PASSWORD')!,
    });

    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME')!;

    this.BASE_URL = `${useSSL ? 'https' : 'http'}://${this.configService
      .getOrThrow<string>('MINIO_HOST')
      .slice(
        0,
        this.configService.getOrThrow<string>('MINIO_HOST').length - 1
      )}:${this.configService.getOrThrow<number>('MINIO_PORT')}/${
      this.bucketName
    }`;
  }

  async uploadBuffer(buffer: Buffer, objectName: string): Promise<void> {
    await this.client.putObject(
      this.bucketName,
      objectName,
      buffer,
      buffer.length
    );
  }

  async uploadFile(destination: string, sourceFilePath: string): Promise<void> {
    await this.client.fPutObject(this.bucketName, destination, sourceFilePath);
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

    await this.client.removeObject(this.bucketName, filePath);
  }
}
