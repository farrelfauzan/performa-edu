import { HttpStatus } from '@nestjs/common';

export function mapGrpcCodeToHttp(grpcCode: number): HttpStatus {
  switch (grpcCode) {
    case 5: // NOT_FOUND
      return HttpStatus.NOT_FOUND;
    case 16: // UNAUTHENTICATED
      return HttpStatus.UNAUTHORIZED;
    case 7: // PERMISSION_DENIED
      return HttpStatus.FORBIDDEN;
    case 3: // INVALID_ARGUMENT
      return HttpStatus.BAD_REQUEST;
    case 13: // INTERNAL
    default:
      return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

export function cleanGrpcErrorMessage(message: string): string {
  // Remove gRPC error code prefix (e.g., "5 NOT_FOUND: " or "16 UNAUTHENTICATED: ")
  const match = message.match(/^\d+\s+\w+:\s*(.+)$/);
  return match ? match[1] : message;
}
