import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export function StudentNotFoundError(id: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Student with id "${id}" not found`,
  });
}

export function StudentByUserIdNotFoundError(userId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Student with userId "${userId}" not found`,
  });
}

export function AssignmentNotFoundError(studentId: string, contentId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Assignment for student "${studentId}" and content "${contentId}" not found`,
  });
}

export function AssignmentAlreadyExistsError(
  studentId: string,
  contentId: string
) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Assignment for student "${studentId}" and content "${contentId}" already exists`,
  });
}

export function InvalidProgressActionError(message: string) {
  throw new RpcException({
    code: status.INVALID_ARGUMENT,
    message,
  });
}
