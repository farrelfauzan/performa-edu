/*
  Warnings:

  - A unique constraint covering the columns `[unique_id]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unique_id` to the `admins` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "unique_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_unique_id_key" ON "admins"("unique_id");
