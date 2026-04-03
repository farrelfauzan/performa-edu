-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "branch_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "active" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "branch_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "branch_name" VARCHAR(255);
