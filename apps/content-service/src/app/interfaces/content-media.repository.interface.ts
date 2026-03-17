import { PresignedUploadResponse } from '@performa-edu/libs';

export interface UploadFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface BulkUploadItem {
  contentMediaId: string;
  file: UploadFile;
}

export interface IContentMediaRepository {
  getUploadUrl(
    filename: string,
    contentType: string
  ): Promise<PresignedUploadResponse>;
  getBulkUploadUrls(
    files: { filename: string; contentType: string }[]
  ): Promise<PresignedUploadResponse[]>;
  uploadAndConvertToHLS(
    contentMediaId: string,
    file: UploadFile,
    callbackUrl?: string
  ): Promise<{ jobId: string }>;
  bulkUploadAndConvertToHLS(
    items: BulkUploadItem[],
    callbackUrl?: string
  ): Promise<{ jobId: string; contentMediaId: string }[]>;
  handleConversionCallback(
    jobId: string,
    status: 'completed' | 'failed',
    masterPlaylistUrl: string | null,
    errorMessage: string | null
  ): Promise<void>;
}
