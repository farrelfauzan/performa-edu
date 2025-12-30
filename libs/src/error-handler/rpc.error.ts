export abstract class RpcError extends Error {
  abstract readonly grpcCode: number;

  constructor(message: string) {
    super(message);
  }
}
