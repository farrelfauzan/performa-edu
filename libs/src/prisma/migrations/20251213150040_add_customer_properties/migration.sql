/*
  Warnings:

  - Added the required column `phone_number` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IdentificationType" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVER_LICENSE');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "identification_number" VARCHAR(50),
ADD COLUMN     "identification_type" "IdentificationType",
ADD COLUMN     "phone_number" VARCHAR(15) NOT NULL;
