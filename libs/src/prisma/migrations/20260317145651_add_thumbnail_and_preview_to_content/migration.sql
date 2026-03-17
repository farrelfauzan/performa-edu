-- AlterTable
ALTER TABLE "content_media" ADD COLUMN     "preview_url" VARCHAR(500);

-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "preview_url" VARCHAR(500),
ADD COLUMN     "thumbnail_url" VARCHAR(500);
