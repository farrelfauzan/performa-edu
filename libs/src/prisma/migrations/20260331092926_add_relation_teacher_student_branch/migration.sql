-- AlterTable
ALTER TABLE "students" ADD COLUMN     "branch_id" TEXT;

-- CreateTable
CREATE TABLE "branch_customers" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branch_customers_branch_id_idx" ON "branch_customers"("branch_id");

-- CreateIndex
CREATE INDEX "branch_customers_customer_id_idx" ON "branch_customers"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_customers_branch_id_customer_id_key" ON "branch_customers"("branch_id", "customer_id");

-- CreateIndex
CREATE INDEX "students_branch_id_idx" ON "students"("branch_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_customers" ADD CONSTRAINT "branch_customers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_customers" ADD CONSTRAINT "branch_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
