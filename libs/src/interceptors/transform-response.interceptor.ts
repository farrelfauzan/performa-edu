import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

import { type IResponse } from '../interfaces';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<IResponse> {
    return next.handle().pipe(
      map((response) => {
        const { data, meta } = response;

        console.log('TransformResponseInterceptor', response);

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          data,
          meta,
        };
      })
    );
  }
}
