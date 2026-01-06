/// <reference types="multer" />

export interface IContentMediaRepository {
  uploadToGCS(file: Express.Multer.File, destination: string): Promise<string>;
  convertToHLS(inputPath: string, outputPath: string): Promise<void>;
  deleteFromGCS(filePath: string): Promise<void>;
  getSignedUrl(filePath: string, expirationTime?: number): Promise<string>;
}
