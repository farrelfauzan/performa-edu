-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_media" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "original_url" VARCHAR(500) NOT NULL,
    "hls_url" VARCHAR(500),
    "thumbnail_url" VARCHAR(500),
    "bucket_name" VARCHAR(255) NOT NULL,
    "object_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "duration" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "processing_status" "MediaProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMPTZ,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "content_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contents_user_id_idx" ON "contents"("user_id");

-- CreateIndex
CREATE INDEX "content_media_content_id_idx" ON "content_media"("content_id");

-- CreateIndex
CREATE INDEX "content_media_processing_status_idx" ON "content_media"("processing_status");

-- AddForeignKey
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
