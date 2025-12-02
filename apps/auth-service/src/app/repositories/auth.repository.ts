import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService, User, Role } from '@performa-edu/libs';
import {
  IAuthRepository,
  CreateUserData,
  UpdateUserData,
  UserWithRoles,
} from '../interfaces/auth.repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // User operations
  async findUserById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id, deletedAt: null },
      });
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
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
    try {
      const data = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { username: identifier }],
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          UserOnRole: {
            select: {
              role: {
                select: {
                  permissions: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return data;
    } catch (error) {
      throw new Error(
        `Failed to find user by email or username: ${error.message}`
      );
    }
  }

  async findUserWithRoles(id: string): Promise<UserWithRoles | null> {
    try {
      return (await this.prisma.user.findUnique({
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
      })) as UserWithRoles;
    } catch (error) {
      throw new Error(`Failed to find user with roles: ${error.message}`);
    }
  }

  async createUser(data: CreateUserData): Promise<User> {
    try {
      // Check for existing email
      const existingEmail = await this.isEmailTaken(data.email);
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }

      // Check for existing username
      const existingUsername = await this.isUsernameTaken(data.username);
      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }

      return await this.prisma.user.create({
        data,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      const user = await this.findUserById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check email uniqueness if email is being updated
      if (data.email && data.email !== user.email) {
        const emailTaken = await this.isEmailTaken(data.email, id);
        if (emailTaken) {
          throw new ConflictException('Email already exists');
        }
      }

      // Check username uniqueness if username is being updated
      if (data.username && data.username !== user.username) {
        const usernameTaken = await this.isUsernameTaken(data.username, id);
        if (usernameTaken) {
          throw new ConflictException('Username already exists');
        }
      }

      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async softDeleteUser(id: string): Promise<User> {
    try {
      const user = await this.findUserById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Role operations
  async findRoleById(id: string): Promise<Role | null> {
    try {
      return await this.prisma.role.findUnique({
        where: { id, deletedAt: null },
      });
    } catch (error) {
      throw new Error(`Failed to find role by ID: ${error.message}`);
    }
  }

  async findRoleByName(name: string): Promise<Role | null> {
    try {
      return await this.prisma.role.findUnique({
        where: { name, deletedAt: null },
      });
    } catch (error) {
      throw new Error(`Failed to find role by name: ${error.message}`);
    }
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      await this.prisma.usersOnRoles.create({
        data: {
          userId,
          roleId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to assign role to user: ${error.message}`);
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      await this.prisma.usersOnRoles.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to remove role from user: ${error.message}`);
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const userRoles = await this.prisma.usersOnRoles.findMany({
        where: { userId },
        include: {
          role: true,
        },
      });

      return userRoles
        .map((ur) => ur.role)
        .filter((role) => role.deletedAt === null);
    } catch (error) {
      throw new Error(`Failed to get user roles: ${error.message}`);
    }
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
