import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  PrismaService,
  User,
  Role,
  Prisma,
  Student,
  Teacher,
  Admin,
} from '@performa-edu/libs';
import {
  IAuthRepository,
  CreateUserData,
  UpdateUserData,
  UserWithRoles,
} from '../interfaces/auth.repository.interface';
import {
  RegisterAdminResponseDto,
  RegisterStudentResponseDto,
  RegisterTeacherResponseDto,
} from '../dto/register-response.dto';
import {
  RegisterAdminDto,
  RegisterStudentDto,
  RegisterTeacherDto,
} from '../dto/register.dto';
import { ProfileResponseDto } from '../dto/profile.dto';

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

  async registerAdmin(
    options: RegisterAdminDto
  ): Promise<RegisterAdminResponseDto> {
    try {
      const emailTaken = await this.isEmailTaken(options.email);

      if (emailTaken) {
        throw new ConflictException('Email already exists');
      }

      const usernameTaken = await this.isUsernameTaken(options.username);

      if (usernameTaken) {
        throw new ConflictException('Username already exists');
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
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to register admin: ${error.message}`);
    }
  }

  async registerStudent(
    data: RegisterStudentDto
  ): Promise<RegisterStudentResponseDto> {
    try {
      const emailTaken = await this.isEmailTaken(data.email);

      if (emailTaken) {
        throw new ConflictException('Email already exists');
      }

      const usernameTaken = await this.isUsernameTaken(data.username);

      if (usernameTaken) {
        throw new ConflictException('Username already exists');
      }

      const userPayload: Prisma.UserCreateInput = {
        email: data.email,
        username: data.username,
        password: data.password,
        UserOnRole: {
          create: data.roleIds.map((roleId) => ({ roleId })),
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
        const createStudent = await tx.student.create({
          data: {
            userId: createUser.id,
            username: data.username,
            studentNumber: data.studentNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            address: data.address,
            email: data.email,
          },
        });
        return { createUser, createStudent };
      });

      return {
        student: result.createStudent,
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
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to register student: ${error.message}`);
    }
  }

  async registerTeacher(
    data: RegisterTeacherDto
  ): Promise<RegisterTeacherResponseDto> {
    try {
      const emailTaken = await this.isEmailTaken(data.email);

      if (emailTaken) {
        throw new ConflictException('Email already exists');
      }

      const usernameTaken = await this.isUsernameTaken(data.username);

      if (usernameTaken) {
        throw new ConflictException('Username already exists');
      }

      const userPayload: Prisma.UserCreateInput = {
        email: data.email,
        username: data.username,
        password: data.password,
        UserOnRole: {
          create: data.roleIds.map((roleId) => ({ roleId })),
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
        const createTeacher = await tx.teacher.create({
          data: {
            userId: createUser.id,
            username: data.username,
            teacherNumber: data.teacherNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            address: data.address,
            email: data.email,
          },
        });
        return { createUser, createTeacher };
      });

      return {
        teacher: result.createTeacher,
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
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to register teacher: ${error.message}`);
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

  async getMe(id: string): Promise<ProfileResponseDto> {
    try {
      let student: Student;
      let teacher: Teacher;
      let admin: Admin;

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

      if (roles.includes('STUDENT')) {
        student = await this.prisma.student.findFirst({
          where: { userId: id, deletedAt: null },
        });
      }

      if (roles.includes('TEACHER')) {
        teacher = await this.prisma.teacher.findFirst({
          where: { userId: id, deletedAt: null },
        });
      }

      if (roles.includes('ADMIN')) {
        admin = await this.prisma.admin.findFirst({
          where: { userId: id, deletedAt: null },
        });
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.UserOnRole.map((ur) => ({
          id: ur.role.id,
          name: ur.role.name,
          permissions: ur.role.permissions.map((p) => String(p)),
        })),
        studentNumber: student ? student.studentNumber : null,
        teacherNumber: teacher ? teacher.teacherNumber : null,
        firstName: student
          ? student.firstName
          : teacher
          ? teacher.firstName
          : null,
        lastName: student
          ? student.lastName
          : teacher
          ? teacher.lastName
          : null,
        phoneNumber: student
          ? student.phoneNumber
          : teacher
          ? teacher.phoneNumber
          : null,
        address: student ? student.address : teacher ? teacher.address : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
        userId: admin ? admin.userId : null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get profile: ${error.message}`);
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
