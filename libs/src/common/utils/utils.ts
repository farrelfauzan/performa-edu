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

export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomString}`;
}

export function transformResponse<T>(data: T) {
  const transformDateToString = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(transformDateToString);
    }
    if (typeof obj === 'object') {
      const transformedObj: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          transformedObj[key] = transformDateToString(obj[key]);
        }
      }
      return transformedObj;
    }
    return obj;
  };

  return transformDateToString(data);
}
