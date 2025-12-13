// Source - https://stackoverflow.com/a
// Posted by Jason White, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-07, License - CC BY-SA 4.0

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const error: any = exception.getError();
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(error.statusCode).json(error);
  }
}
