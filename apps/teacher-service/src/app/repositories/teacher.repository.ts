import { Injectable } from '@nestjs/common';
import { ITeacherRepository } from '../interfaces/teacher-interface';
import {
  Teacher,
  DynamicQueryBuilder,
  generateUniqueId,
  PageMeta,
  PageMetaDto,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import {
  CreateTeacherRequest,
  CreateTeacherResponse,
  DeleteTeacherRequest,
  DeleteTeacherResponse,
  GetAllTeachersRequest,
  UpdateTeacherRequest,
  UpdateTeacherResponse,
  ProfilePictureUploadUrlRequest,
  ProfilePictureUploadUrlResponse,
} from '@performa-edu/proto-types/teacher-service';
import { TeacherNotFoundError } from '../error/teacher.error';
import { randomUUID } from 'crypto';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { BranchNotFoundError } from 'apps/branch-service/src/app/error/branch.error';

@Injectable()
export class TeacherRepository implements ITeacherRepository {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicQueryBuilder: DynamicQueryBuilder,
    private readonly configService: ConfigService
  ) {
    this.region =
      this.configService.get<string>('AWS_REGION') || 'ap-southeast-1';
    this.bucketName =
      this.configService.get<string>('S3_BUCKET_NAME') || 'performa-assets';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY'
        ),
      },
    });
  }

  async createTeacher(
    options: CreateTeacherRequest
  ): Promise<CreateTeacherResponse> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: options.branchId },
    });

    if (!branch) {
      BranchNotFoundError(options.branchId);
    }

    const teacher = await this.prisma.teacher.create({
      data: {
        userId: options.userId,
        uniqueId: generateUniqueId('TCHR'),
        fullName: options.fullName,
        branchId: options.branchId,
        branchName: branch.name || null,
        phoneNumber: options.phoneNumber || null,
        ...(options.dateOfBirth
          ? { dateOfBirth: new Date(options.dateOfBirth) }
          : {}),
        ...(options.profilePictureUrl
          ? { profilePictureUrl: options.profilePictureUrl }
          : {}),
      },
    });

    return {
      teacher: transformResponse(teacher),
    };
  }

  async getAllTeachers(
    options: GetAllTeachersRequest
  ): Promise<{ data: Teacher[]; meta: PageMetaDto }> {
    const searchFiled = ['fullName', 'phoneNumber'];

    const teachers = await this.dynamicQueryBuilder.buildDynamicQuery(
      'Teacher',
      {
        ...options,
        where: {
          OR: searchFiled.map((field) => ({
            [field]: {
              contains: options.search || '',
              mode: 'insensitive',
            },
          })),
        },
      }
    );

    const meta: PageMeta = {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
      count: teachers.count,
    };

    return {
      data: transformResponse<Teacher[]>(teachers.data),
      meta,
    };
  }

  async getTeacherById(id: string): Promise<{ data: Teacher }> {
    const teacher = await this.prisma.findFirstActive<Teacher>(
      this.prisma.teacher,
      {
        where: { id },
      }
    );

    if (!teacher) {
      TeacherNotFoundError(id);
    }

    return { data: transformResponse<Teacher>(teacher) };
  }

  async getProfilePictureUploadUrl(
    options: ProfilePictureUploadUrlRequest
  ): Promise<ProfilePictureUploadUrlResponse> {
    const ext = options.filename.split('.').pop()?.toLowerCase() || 'jpg';
    const s3Key = `teacher-profile-pictures/${randomUUID()}.${ext}`;

    const presigned = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: s3Key,
      Conditions: [
        { 'Content-Type': options.contentType },
        ['content-length-range', 0, 5 * 1024 * 1024], // Max 5MB
      ],
      Fields: {
        'Content-Type': options.contentType,
      },
      Expires: 3600,
    });

    const publicUrl = `https://dv0u9v99guak9.cloudfront.net/${s3Key}`;

    return {
      uploadUrl: presigned.url,
      fields: presigned.fields,
      s3Key,
      publicUrl,
      expiresIn: 3600,
    };
  }

  async updateTeacher(
    id: string,
    options: UpdateTeacherRequest
  ): Promise<UpdateTeacherResponse> {
    const teacher = this.prisma.findFirstActive<Teacher>(this.prisma.teacher, {
      where: { id },
    });

    if (!teacher) {
      TeacherNotFoundError(id);
    }

    const updatedTeacher = await this.prisma.teacher.update({
      where: { id },
      data: {
        fullName: options.fullName,
        phoneNumber: options.phoneNumber,
        dateOfBirth: options.dateOfBirth,
      },
    });

    return {
      teacher: transformResponse<Teacher>(updatedTeacher),
    };
  }

  async deleteTeacher(
    options: DeleteTeacherRequest
  ): Promise<DeleteTeacherResponse> {
    const teacher = await this.prisma.findFirstActive<Teacher>(
      this.prisma.teacher,
      {
        where: { id: options.id },
      }
    );

    if (!teacher) {
      TeacherNotFoundError(options.id);
    }

    await this.prisma.softDelete<Teacher>(this.prisma.teacher, {
      id: options.id,
    });

    return {
      message: 'Teacher deleted successfully',
    };
  }
}
