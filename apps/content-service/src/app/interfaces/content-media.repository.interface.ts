/// <reference types="multer" />

export interface IContentMediaRepository {
  convertToHLS(inputPath: string, outputPath: string): Promise<void>;
  getSignedUrl(filePath: string, expirationTime?: number): Promise<string>;
}
