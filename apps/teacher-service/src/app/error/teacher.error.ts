/* ============================
   Base Error
============================ */

import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

/* ============================
  Teacher Errors
============================ */

export function TeacherNotFoundError(teacherId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Teacher with id "${teacherId}" not found`,
  });
}

export function TeacherEmailAlreadyExistsError(email: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Teacher with email "${email}" already exists`,
  });
}

export function TeacherPhoneNumberAlreadyExistsError(phoneNumber: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Teacher with phone number "${phoneNumber}" already exists`,
  });
}
