import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export function BranchNotFoundError(branchId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Branch with id "${branchId}" not found`,
  });
}

export function BranchAlreadyExistsError(name: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Branch with name "${name}" already exists`,
  });
}
