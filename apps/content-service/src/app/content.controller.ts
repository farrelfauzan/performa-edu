import { Controller, Get } from '@nestjs/common';
import { ContentService } from './content.service';
import {
  ContentServiceControllerMethods,
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

@Controller()
@ContentServiceControllerMethods()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  async getAllContents(options: GetAllContentsRequest): Promise<{
    data: GetAllContentsResponse['contents'];
    meta: GetAllContentsResponse['pageMeta'];
  }> {
    const { data, meta } = await this.contentService.getAllContents(options);
    return { data, meta };
  }

  async getContentById(options: GetContentByIdRequest): Promise<{
    data: GetContentByIdResponse['content'];
  }> {
    const { data } = await this.contentService.getContentById(options);
    return { data };
  }

  async createContent(options: CreateContentRequest): Promise<{
    data: CreateContentResponse['content'];
  }> {
    const { data } = await this.contentService.createContent(options);
    return { data };
  }

  async updateContent(options: UpdateContentRequest): Promise<{
    data: UpdateContentResponse['content'];
  }> {
    const { data } = await this.contentService.updateContent(options);
    return { data };
  }

  async deleteContent(
    options: DeleteContentRequest
  ): Promise<DeleteContentResponse> {
    return this.contentService.deleteContent(options);
  }
}
