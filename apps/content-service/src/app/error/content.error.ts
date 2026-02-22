/* ============================
   Base Error
============================ */

import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

/* ============================
  Content Errors
============================ */

export function ContentNotFoundError(contentId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Content with id "${contentId}" not found`,
  });
}

export function ContentTitleAlreadyExistsError(title: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Content with title "${title}" already exists`,
  });
}
