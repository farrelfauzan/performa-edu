import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

export function ClassNotFoundError(classId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Class with id "${classId}" not found`,
  });
}

export function ClassAlreadyExistsError(name: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Class with name "${name}" already exists`,
  });
}

export function TeacherAlreadyInClassError(teacherId: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Teacher "${teacherId}" is already in this class`,
  });
}

export function StudentAlreadyInClassError(studentId: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Student "${studentId}" is already in this class`,
  });
}
