/*
  Warnings:

  - You are about to drop the column `identification_number` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `identification_type` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "identification_number",
DROP COLUMN "identification_type";
