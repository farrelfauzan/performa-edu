import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class GrpcErrorHandler {
  /**
   * Converts gRPC error codes to HTTP status codes
   */
  private mapGrpcCodeToHttp(grpcCode: number): HttpStatus {
    switch (grpcCode) {
      case 0: // OK
        return HttpStatus.OK;
      case 3: // INVALID_ARGUMENT
        return HttpStatus.BAD_REQUEST;
      case 5: // NOT_FOUND
        return HttpStatus.NOT_FOUND;
      case 6: // ALREADY_EXISTS
        return HttpStatus.CONFLICT;
      case 7: // PERMISSION_DENIED
        return HttpStatus.FORBIDDEN;
      case 8: // RESOURCE_EXHAUSTED
        return HttpStatus.TOO_MANY_REQUESTS;
      case 9: // FAILED_PRECONDITION
        return HttpStatus.PRECONDITION_FAILED;
      case 12: // UNIMPLEMENTED
        return HttpStatus.NOT_IMPLEMENTED;
      case 13: // INTERNAL
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case 14: // UNAVAILABLE
        return HttpStatus.SERVICE_UNAVAILABLE;
      case 16: // UNAUTHENTICATED
        return HttpStatus.UNAUTHORIZED;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * Cleans gRPC error message by removing error code prefix
   */
  private cleanGrpcErrorMessage(message: string): string {
    // Remove gRPC error code prefix (e.g., "5 NOT_FOUND: " or "16 UNAUTHENTICATED: ")
    const match = message.match(/^\d+\s+\w+:\s*(.+)$/);
    return match ? match[1] : message;
  }

  /**
   * Handles gRPC errors and converts them to HTTP exceptions
   */
  handleGrpcError(error: any, defaultMessage = 'Service unavailable'): never {
    if (error.code) {
      const statusCode = this.mapGrpcCodeToHttp(error.code);
      const cleanMessage = this.cleanGrpcErrorMessage(
        error.message || error.details || defaultMessage
      );
      throw new HttpException(cleanMessage, statusCode);
    }

    throw new HttpException(defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  /**
   * RxJS operator for handling gRPC errors in Observable streams
   * Usage: observable.pipe(this.grpcErrorHandler.catchGrpcError())
   */
  catchGrpcError<T>(defaultMessage?: string) {
    return (source: Observable<T>): Observable<T> =>
      source.pipe(
        catchError((error) => {
          // Convert gRPC error to RpcException for microservices
          if (error.code) {
            return throwError(
              () =>
                new RpcException({
                  code: error.code,
                  message: this.cleanGrpcErrorMessage(
                    error.message ||
                      error.details ||
                      defaultMessage ||
                      'Service error'
                  ),
                })
            );
          }

          // For non-gRPC errors, wrap in RpcException
          return throwError(
            () =>
              new RpcException({
                code: 13, // INTERNAL
                message:
                  error.message || defaultMessage || 'Internal server error',
              })
          );
        })
      );
  }

  /**
   * RxJS operator for handling gRPC errors and converting to HTTP exceptions
   * Usage: observable.pipe(this.grpcErrorHandler.catchGrpcHttpError())
   */
  catchGrpcHttpError<T>(defaultMessage?: string) {
    return (source: Observable<T>): Observable<T> =>
      source.pipe(
        catchError((error) => {
          this.handleGrpcError(error, defaultMessage);
          return throwError(() => error); // This line won't be reached
        })
      );
  }
}
