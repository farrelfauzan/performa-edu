import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  profilePictureUrl: z.string().url('Invalid URL').optional(),
  bio: z.string().max(160, 'Bio must be at most 160 characters').optional(),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}

export const ProfilePictureUploadUrlSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z
    .string()
    .min(1, 'Content type is required')
    .regex(/^image\/(jpeg|png|gif|webp)$/, 'Only JPEG, PNG, GIF, or WebP images are allowed'),
});

export class ProfilePictureUploadUrlDto extends createZodDto(
  ProfilePictureUploadUrlSchema,
) {}
