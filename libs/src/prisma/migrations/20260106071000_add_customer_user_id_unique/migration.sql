-- DropEnum
DROP TYPE IF EXISTS "IdentificationType";

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_key" ON "customers"("user_id");
