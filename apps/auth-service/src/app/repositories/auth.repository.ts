import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PrismaService,
  User,
  Prisma,
  Admin,
  UserType,
  RegisterAdminDto,
  RegisterAdminResponseDto,
  ProfileResponseDto,
  Customer,
  generateUniqueId,
} from '@performa-edu/libs';
import {
  IAuthRepository,
  UserWithRoles,
} from '../interfaces/auth.repository.interface';
import {
  EmailAlreadyExistsError,
  UserByEmailOrUsernameError,
  UsernameAlreadyExistsError,
  UserNotFoundError,
  UserWithRolesNotFoundError,
} from '../errors/auth-errors';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserByIdRequest,
  DeleteUserByIdResponse,
} from '@performa-edu/proto-types/auth-service';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // User operations
  async findUserById(id: string): Promise<UserType | null> {
    const user = await this.prisma.findFirstActive<UserType>(this.prisma.user, {
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      UserNotFoundError(id);
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email, deletedAt: null },
      });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username, deletedAt: null },
      });
    } catch (error) {
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  }

  async findUserByEmailOrUsername(
    identifier: string
  ): Promise<Partial<User> | null> {
    const user = await this.prisma.findFirstActive<Partial<User>>(
      this.prisma.user,
      {
        where: {
          OR: [{ email: identifier }, { username: identifier }],
        },
      }
    );

    if (!user) {
      UserByEmailOrUsernameError(identifier);
    }

    return user;
  }

  async findUserWithRoles(id: string): Promise<UserWithRoles | null> {
    try {
      const user = await this.prisma.findFirstActive<UserWithRoles>(
        this.prisma.user,
        {
          where: { id },
          include: {
            UserOnRole: {
              include: {
                role: true,
              },
            },
          },
        }
      );

      if (!user) {
        UserWithRolesNotFoundError(id);
      }

      return user;
    } catch (error) {
      throw new RpcException({
        code: status.INTERNAL,
        message: `Failed to find user with roles: ${error.message}`,
      });
    }
  }

  async createUser(options: CreateUserRequest): Promise<CreateUserResponse> {
    const emailTaken = await this.isEmailTaken(options.email);

    if (emailTaken) {
      EmailAlreadyExistsError(options.email);
    }

    const usernameTaken = await this.isUsernameTaken(options.username);

    if (usernameTaken) {
      UsernameAlreadyExistsError(options.username);
    }

    const user = await this.prisma.user.create({
      data: {
        email: options.email,
        username: options.username,
        password: options.password,
        active: 'ACTIVE',
        UserOnRole: {
          create: options.roleIds.map((roleId) => ({ roleId })),
        },
      },
      include: {
        UserOnRole: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      active: user.active,
      roles: user.UserOnRole.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions.map((p) => String(p)),
      })),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
    };
  }

  async registerAdmin(
    options: RegisterAdminDto
  ): Promise<RegisterAdminResponseDto> {
    const emailTaken = await this.isEmailTaken(options.email);

    if (emailTaken) {
      EmailAlreadyExistsError(options.email);
    }

    const usernameTaken = await this.isUsernameTaken(options.username);

    if (usernameTaken) {
      UsernameAlreadyExistsError(options.username);
    }

    const userPayload: Prisma.UserCreateInput = {
      email: options.email,
      username: options.username,
      password: options.password,
      UserOnRole: {
        create: options.roleIds.map((roleId) => ({ roleId })),
      },
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const createUser = await tx.user.create({
        data: userPayload,
        include: {
          UserOnRole: {
            include: {
              role: true,
            },
          },
        },
      });
      const createAdmin = await tx.admin.create({
        data: {
          uniqueId: generateUniqueId('ADMIN'),
          userId: createUser.id,
          email: options.email,
        },
      });
      return { createUser, createAdmin };
    });

    return {
      admin: result.createAdmin,
      user: {
        id: result.createUser.id,
        username: result.createUser.username,
        email: result.createUser.email,
        roles: result.createUser.UserOnRole.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          permissions: ur.role.permissions.map((p) => String(p)),
        })),
      },
    };
  }

  async deleteUserById(
    options: DeleteUserByIdRequest
  ): Promise<DeleteUserByIdResponse> {
    const user = await this.prisma.findFirstActive<User>(this.prisma.user, {
      where: { id: options.id },
    });

    if (!user) {
      UserNotFoundError(options.id);
    }

    await this.prisma.softDelete(this.prisma.user, {
      where: { id: options.id },
    });

    return { message: `User with ID ${options.id} has been deleted.` };
  }

  async getMe(id: string): Promise<ProfileResponseDto> {
    let admin: Admin;
    let customer: Customer;

    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        UserOnRole: {
          include: {
            role: true,
          },
          where: {
            role: {
              deletedAt: null,
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.UserOnRole.map((ur) => ur.role.name);

    if (roles.includes('ADMIN')) {
      admin = await this.prisma.admin.findFirst({
        where: { userId: id, deletedAt: null },
      });
    }

    if (roles.includes('CUSTOMER')) {
      customer = await this.prisma.findFirstActive(this.prisma.customer, {
        where: { userId: id },
      });
    }

    return {
      id: admin.id || customer.id,
      username: user.username,
      uniqueId: customer.uniqueId || admin.uniqueId,
      email: user.email,
      roles: user.UserOnRole.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions.map((p) => String(p)),
      })),
      fullName: customer?.fullName || null,
      dateOfBirth: customer?.dateOfBirth || null,
      phoneNumber: customer?.phoneNumber || null,
      address: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      userId: user.id,
    };
  }

  // Validation methods
  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email,
          deletedAt: null,
          ...(excludeUserId && { id: { not: excludeUserId } }),
        },
      });
      return !!user;
    } catch (error) {
      throw new Error(`Failed to check email availability: ${error.message}`);
    }
  }

  async isUsernameTaken(
    username: string,
    excludeUserId?: string
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          username,
          deletedAt: null,
          ...(excludeUserId && { id: { not: excludeUserId } }),
        },
      });
      return !!user;
    } catch (error) {
      throw new Error(
        `Failed to check username availability: ${error.message}`
      );
    }
  }
}
