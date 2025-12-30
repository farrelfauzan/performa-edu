/* ============================
   Base Error
============================ */

import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

/* ============================
  User Errors
============================ */

export function UserNotFoundError(userId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `User with id "${userId}" not found`,
  });
}

export function InvalidCredentialsError() {
  throw new RpcException({
    code: status.UNAUTHENTICATED,
    message: `Invalid credentials provided`,
  });
}

export function UserAlreadyExistsError(identifier: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `User with identifier "${identifier}" already exists`,
  });
}

export function UserEmailNotFoundError(email: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `User with email "${email}" not found`,
  });
}

export function UserWithRolesNotFoundError(userId: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `User with roles for user id "${userId}" not found`,
  });
}

export function UserUsernameNotFoundError(username: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `User with username "${username}" not found`,
  });
}

export function UsernameAlreadyExistsError(username: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Username "${username}" is already taken`,
  });
}

export function EmailAlreadyExistsError(email: string) {
  throw new RpcException({
    code: status.ALREADY_EXISTS,
    message: `Email "${email}" is already registered`,
  });
}

/* ============================
  Authentication Errors
============================ */

export function UserByEmailOrUsernameError(identifier: string) {
  throw new RpcException({
    code: status.NOT_FOUND,
    message: `User with email or username "${identifier}" not found`,
  });
}

export function InvalidPasswordError() {
  throw new RpcException({
    code: status.UNAUTHENTICATED,
    message: `Invalid password provided`,
  });
}
