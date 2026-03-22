import { Controller } from '@nestjs/common';
import { ContentService } from './content.service';
import {
  ContentServiceControllerMethods,
  ConversionWebhookRequest,
  ConversionWebhookResponse,
  CreateContentRequest,
  CreateContentResponse,
  CreateContentWithSectionsRequest,
  CreateContentWithSectionsResponse,
  DeleteContentRequest,
  DeleteContentResponse,
  GetAllContentsRequest,
  GetAllContentsResponse,
  GetAllCategoriesRequest,
  GetAllCategoriesResponse,
  GetContentByIdRequest,
  GetContentByIdResponse,
  StartContentConversionRequest,
  StartContentConversionResponse,
  UpdateContentRequest,
  UpdateContentResponse,
} from '@performa-edu/proto-types/content-service';

@Controller()
@ContentServiceControllerMethods()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  async getAllContents(
    options: GetAllContentsRequest
  ): Promise<GetAllContentsResponse> {
    const { data, meta } = await this.contentService.getAllContents(options);
    return { contents: data, pageMeta: meta };
  }

  async getContentById(
    options: GetContentByIdRequest
  ): Promise<GetContentByIdResponse> {
    const { data } = await this.contentService.getContentById(options);
    return { content: data, media: [] };
  }

  async createContent(
    options: CreateContentRequest
  ): Promise<CreateContentResponse> {
    const { data } = await this.contentService.createContent(options);
    return { content: data };
  }

  async updateContent(
    options: UpdateContentRequest
  ): Promise<UpdateContentResponse> {
    const { data } = await this.contentService.updateContent(options);
    return { content: data };
  }

  async deleteContent(
    options: DeleteContentRequest
  ): Promise<DeleteContentResponse> {
    return this.contentService.deleteContent(options);
  }

  async createContentWithSections(
    options: CreateContentWithSectionsRequest
  ): Promise<CreateContentWithSectionsResponse> {
    return this.contentService.createContentWithSections(options);
  }

  async startContentConversion(
    options: StartContentConversionRequest
  ): Promise<StartContentConversionResponse> {
    return this.contentService.startContentConversion(options);
  }

  async handleConversionWebhook(
    options: ConversionWebhookRequest
  ): Promise<ConversionWebhookResponse> {
    return this.contentService.handleConversionWebhook(options);
  }

  async getAllCategories(
    options: GetAllCategoriesRequest
  ): Promise<GetAllCategoriesResponse> {
    return this.contentService.getAllCategories(options);
  }
}
