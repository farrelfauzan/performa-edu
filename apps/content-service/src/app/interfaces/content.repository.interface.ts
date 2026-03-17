import {
  CreateContentRequest,
  CreateContentResponse,
  CreateContentWithSectionsRequest,
  CreateContentWithSectionsResponse,
  DeleteContentRequest,
  DeleteContentResponse,
  GetAllContentsRequest,
  GetAllContentsResponse,
  GetContentByIdRequest,
  GetContentByIdResponse,
  StartContentConversionRequest,
  StartContentConversionResponse,
  UpdateContentRequest,
  UpdateContentResponse,
} from '@performa-edu/proto-types/content-service';

export interface IContentRepository {
  getAllContents(options: GetAllContentsRequest): Promise<{
    data: GetAllContentsResponse['contents'];
    meta: GetAllContentsResponse['pageMeta'];
  }>;
  getContentById(options: GetContentByIdRequest): Promise<{
    data: GetContentByIdResponse['content'];
  }>;
  createContent(options: CreateContentRequest): Promise<{
    data: CreateContentResponse['content'];
  }>;
  createContentWithSections(
    options: CreateContentWithSectionsRequest
  ): Promise<CreateContentWithSectionsResponse>;
  startContentConversion(
    options: StartContentConversionRequest
  ): Promise<StartContentConversionResponse>;
  updateContent(options: UpdateContentRequest): Promise<{
    data: UpdateContentResponse['content'];
  }>;
  deleteContent(options: DeleteContentRequest): Promise<DeleteContentResponse>;
}
