import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GrpcErrorHandler } from '@performa-edu/libs';
import {
  CONTENT_SERVICE_NAME,
  CONTENTSERVICE_PACKAGE_NAME,
  ContentServiceClient,
  CreateContentRequest,
  CreateContentResponse,
  DeleteContentRequest,
  DeleteContentResponse,
  GetAllContentsRequest,
  GetAllContentsResponse,
  GetContentByIdRequest,
  GetContentByIdResponse,
  UpdateContentRequest,
  UpdateContentResponse,
} from '@performa-edu/proto-types/content-service';
import { ContentRepository } from './repositories/content.repository';

@Injectable()
export class ContentService implements OnModuleInit {
  private contentService: ContentServiceClient;

  constructor(
    @Inject(CONTENTSERVICE_PACKAGE_NAME)
    private readonly client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler,
    private readonly contentRepository: ContentRepository
  ) {}

  onModuleInit() {
    this.contentService =
      this.client.getService<ContentServiceClient>(CONTENT_SERVICE_NAME);
  }

  async getAllContents(options: GetAllContentsRequest): Promise<{
    data: GetAllContentsResponse['contents'];
    meta: GetAllContentsResponse['pageMeta'];
  }> {
    const { data, meta } = await this.contentRepository.getAllContents(options);
    return { data, meta };
  }

  async getContentById(options: GetContentByIdRequest): Promise<{
    data: GetContentByIdResponse['content'];
  }> {
    const { data } = await this.contentRepository.getContentById(options);
    return { data };
  }

  async createContent(options: CreateContentRequest): Promise<{
    data: CreateContentResponse['content'];
  }> {
    const { data } = await this.contentRepository.createContent(options);
    return { data };
  }

  async updateContent(options: UpdateContentRequest): Promise<{
    data: UpdateContentResponse['content'];
  }> {
    const { data } = await this.contentRepository.updateContent(options);
    return { data };
  }

  async deleteContent(
    options: DeleteContentRequest
  ): Promise<DeleteContentResponse> {
    return this.contentRepository.deleteContent(options);
  }
}
