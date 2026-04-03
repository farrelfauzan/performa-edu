import { Injectable } from '@nestjs/common';
import { IStudentRepository } from '../interfaces/student.interface';
import {
  DynamicQueryBuilder,
  generateUniqueId,
  PageMeta,
  PageMetaDto,
  PrismaService,
  transformResponse,
} from '@performa-edu/libs';
import {
  RegisterStudentRequest,
  RegisterStudentResponse,
  GetAllStudentsRequest,
  Student,
  UpdateStudentRequest,
  UpdateStudentResponse,
  DeleteStudentRequest,
  DeleteStudentResponse,
  ProfilePictureUploadUrlRequest,
  ProfilePictureUploadUrlResponse,
} from '@performa-edu/proto-types/student-service';
import {
  StudentNotFoundError,
  StudentByUserIdNotFoundError,
} from '../errors/student.errors';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { BranchNotFoundError } from 'apps/branch-service/src/app/error/branch.error';

@Injectable()
export class StudentRepository implements IStudentRepository {
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

  async getProfilePictureUploadUrl(
    options: ProfilePictureUploadUrlRequest
  ): Promise<ProfilePictureUploadUrlResponse> {
    const ext = options.filename.split('.').pop()?.toLowerCase() || 'jpg';
    const s3Key = `student-profile-pictures/${randomUUID()}.${ext}`;

    const presigned = await createPresignedPost(this.s3Client, {
      Bucket: this.bucketName,
      Key: s3Key,
      Conditions: [
        { 'Content-Type': options.contentType },
        ['content-length-range', 1, 2 * 1024 * 1024],
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

  async registerStudent(
    options: RegisterStudentRequest
  ): Promise<RegisterStudentResponse> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: options.branchId },
    });

    if (!branch) {
      BranchNotFoundError(options.branchId);
    }

    const student = await this.prisma.student.create({
      data: {
        userId: options.userId,
        uniqueId: generateUniqueId('STU'),
        fullName: options.fullName,
        branchId: options.branchId,
        branchName: branch?.name || null,
        ...(options.phoneNumber ? { phoneNumber: options.phoneNumber } : {}),
        ...(options.dateOfBirth
          ? { dateOfBirth: new Date(options.dateOfBirth) }
          : {}),
        ...(options.profilePictureUrl
          ? { profilePictureUrl: options.profilePictureUrl }
          : {}),
        ...(options.bio ? { bio: options.bio } : {}),
      },
    });

    return {
      student: transformResponse(student),
    };
  }

  async getAllStudents(
    options: GetAllStudentsRequest
  ): Promise<{ data: Student[]; meta: PageMetaDto }> {
    const searchFields = ['fullName', 'uniqueId'];

    const students = await this.dynamicQueryBuilder.buildDynamicQuery(
      'Student',
      {
        ...options,
        where: {
          OR: searchFields.map((field) => ({
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
      count: students.count,
    };

    return {
      data: transformResponse<Student[]>(students.data as any),
      meta,
    };
  }

  async getStudentById(id: string): Promise<{ data: Student }> {
    const student = await this.prisma.findFirstActive(this.prisma.student, {
      where: { id },
    });

    if (!student) {
      StudentNotFoundError(id);
    }

    return { data: transformResponse<Student>(student as any) };
  }

  async getStudentByUserId(userId: string): Promise<{ data: Student }> {
    const student = await this.prisma.findFirstActive(this.prisma.student, {
      where: { userId },
    });

    if (!student) {
      StudentByUserIdNotFoundError(userId);
    }

    return { data: transformResponse<Student>(student as any) };
  }

  async updateStudent(
    id: string,
    options: UpdateStudentRequest
  ): Promise<UpdateStudentResponse> {
    const student = await this.prisma.findFirstActive(this.prisma.student, {
      where: { id },
    });

    if (!student) {
      StudentNotFoundError(id);
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: {
        ...(options.fullName !== undefined && { fullName: options.fullName }),
        ...(options.phoneNumber !== undefined && {
          phoneNumber: options.phoneNumber,
        }),
        ...(options.dateOfBirth !== undefined && {
          dateOfBirth: new Date(options.dateOfBirth),
        }),
        ...(options.bio !== undefined && { bio: options.bio }),
      },
    });

    return {
      student: transformResponse<Student>(updatedStudent as any),
    };
  }

  async deleteStudent(
    options: DeleteStudentRequest
  ): Promise<DeleteStudentResponse> {
    const student = await this.prisma.findFirstActive(this.prisma.student, {
      where: { id: options.id },
    });

    if (!student) {
      StudentNotFoundError(options.id);
    }

    await this.prisma.softDelete(this.prisma.student, {
      id: options.id,
    });

    return {
      message: 'Student deleted successfully',
    };
  }
}
