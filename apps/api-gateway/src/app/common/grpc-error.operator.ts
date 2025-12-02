import { catchError } from 'rxjs/operators';
import { Observable, throwError, firstValueFrom } from 'rxjs';
import { GrpcErrorHandler } from './grpc-error.handler';

/**
 * Custom RxJS operator for handling gRPC errors
 */
export function handleGrpcError<T>(
  errorHandler: GrpcErrorHandler,
  defaultMessage?: string
) {
  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      catchError((error) => {
        errorHandler.handleGrpcError(error, defaultMessage);
        return throwError(() => error); // This line won't be reached due to the throw above
      })
    );
}

/**
 * Helper function that combines firstValueFrom with gRPC error handling
 */
export async function handleGrpcCall<T>(
  observable: Observable<T>,
  errorHandler: GrpcErrorHandler,
  defaultMessage?: string
): Promise<T> {
  return firstValueFrom(
    observable.pipe(handleGrpcError(errorHandler, defaultMessage))
  );
}
