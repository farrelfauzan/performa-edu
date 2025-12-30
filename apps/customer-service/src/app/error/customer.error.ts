/* ============================
   Base Error
============================ */

import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

/* ============================
  Customer Errors
============================ */

export function CustomerNotFoundError(customerId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `Customer with id "${customerId}" not found`,
  });
}

export function CustomerEmailAlreadyExistsError(email: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Customer with email "${email}" already exists`,
  });
}

export function CustomerPhoneNumberAlreadyExistsError(phoneNumber: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Customer with phone number "${phoneNumber}" already exists`,
  });
}
