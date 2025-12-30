-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unique_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" "ActiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "customers_unique_id_key" ON "customers"("unique_id");
-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");