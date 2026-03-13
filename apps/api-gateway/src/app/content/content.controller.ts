import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  Auth,
  AuthUser,
  CreateContentDto,
  GetAllContentDto,
  GrpcErrorHandler,
  handleGrpcCall,
  LoggedUserType,
  UpdateContentDto,
} from '@performa-edu/libs';
import { AclAction, AclSubject } from 'libs/src/constant';
import {
  Content,
  CONTENT_SERVICE_NAME,
  CONTENTSERVICE_PACKAGE_NAME,
  ContentServiceClient,
  CreateContentResponse,
  DeleteContentResponse,
  GetAllContentsResponse,
  GetContentByIdResponse,
  UpdateContentResponse,
} from '@performa-edu/proto-types/content-service';

@Controller({
  version: '1',
  path: 'contents',
})
export class ContentController implements OnModuleInit {
  private contentService: ContentServiceClient;

  constructor(
    @Inject(CONTENTSERVICE_PACKAGE_NAME)
    private client: ClientGrpc,
    private readonly grpcErrorHandler: GrpcErrorHandler
  ) {}

  onModuleInit() {
    this.contentService =
      this.client.getService<ContentServiceClient>(CONTENT_SERVICE_NAME);
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.CONTENT }])
  @Get()
  async getContents(@Query() options: GetAllContentDto): Promise<{
    data: GetAllContentsResponse['contents'];
    meta: GetAllContentsResponse['pageMeta'];
  }> {
    const result = await handleGrpcCall(
      this.contentService.getAllContents(options),
      this.grpcErrorHandler,
      'Failed to fetch contents'
    );

    return {
      data: result.contents,
      meta: result.pageMeta,
    };
  }

  @Auth([{ action: AclAction.READ, subject: AclSubject.CONTENT }])
  @Get(':id')
  async getContentById(@Param('id') id: string): Promise<{
    data: GetContentByIdResponse;
  }> {
    const result = await handleGrpcCall(
      this.contentService.getContentById({ id }),
      this.grpcErrorHandler,
      'Failed to fetch content by ID'
    );

    return {
      data: {
        content: result.content,
        media: result.media || [],
      },
    };
  }

  @Auth([{ action: AclAction.CREATE, subject: AclSubject.CONTENT }])
  @Post()
  async createContent(
    @Body() options: CreateContentDto,
    @AuthUser() user: LoggedUserType
  ): Promise<{
    data: CreateContentResponse['content'];
  }> {
    const result = await handleGrpcCall(
      this.contentService.createContent({
        ...options,
        userId: user.userId,
        media: [],
      }),
      this.grpcErrorHandler,
      'Failed to create content'
    );

    return {
      data: result.content,
    };
  }

  @Auth([{ action: AclAction.UPDATE, subject: AclSubject.CONTENT }])
  @Put(':id')
  async updateContent(
    @Param('id') id: string,
    @Body() options: UpdateContentDto
  ): Promise<{
    data: UpdateContentResponse['content'];
  }> {
    const result = await handleGrpcCall(
      this.contentService.updateContent({
        id,
        ...options,
        media: [],
      }),
      this.grpcErrorHandler,
      'Failed to update content'
    );

    return {
      data: result.content,
    };
  }

  @Auth([{ action: AclAction.DELETE, subject: AclSubject.CONTENT }])
  @Delete(':id')
  async deleteContent(@Param('id') id: string): Promise<{
    data: DeleteContentResponse;
  }> {
    const result = await handleGrpcCall(
      this.contentService.deleteContent({ id }),
      this.grpcErrorHandler,
      'Failed to delete content'
    );

    return { data: result };
  }
}
