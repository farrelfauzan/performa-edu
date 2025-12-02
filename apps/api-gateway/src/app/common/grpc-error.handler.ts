import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class GrpcErrorHandler {
  /**
   * Converts gRPC error codes to HTTP status codes
   */
  private mapGrpcCodeToHttp(grpcCode: number): HttpStatus {
    switch (grpcCode) {
      case 5: // NOT_FOUND
        return HttpStatus.NOT_FOUND;
      case 16: // UNAUTHENTICATED
        return HttpStatus.UNAUTHORIZED;
      case 7: // PERMISSION_DENIED
        return HttpStatus.FORBIDDEN;
      case 3: // INVALID_ARGUMENT
        return HttpStatus.BAD_REQUEST;
      case 6: // ALREADY_EXISTS
        return HttpStatus.CONFLICT;
      case 9: // FAILED_PRECONDITION
        return HttpStatus.PRECONDITION_FAILED;
      case 13: // INTERNAL
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
}
