/*
  Warnings:

  - Added the required column `content_type` to the `content_media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `contents` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'VIDEO', 'IMAGE');

-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE 'WAITING_REVIEW';

-- AlterTable
ALTER TABLE "content_media" ADD COLUMN     "content_type" "ContentType" NOT NULL,
ADD COLUMN     "section_id" TEXT;

-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "year" SMALLINT NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "bio" TEXT;

-- CreateTable
CREATE TABLE "content_sections" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "content_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_sections_content_id_idx" ON "content_sections"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "content_media_section_id_idx" ON "content_media"("section_id");

-- CreateIndex
CREATE INDEX "contents_category_id_idx" ON "contents"("category_id");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_sections" ADD CONSTRAINT "content_sections_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "content_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
