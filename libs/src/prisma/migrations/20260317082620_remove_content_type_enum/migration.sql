/*
  Warnings:

  - You are about to drop the column `content_type` on the `content_media` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "content_media" DROP COLUMN "content_type";

-- DropEnum
DROP TYPE "ContentType";
