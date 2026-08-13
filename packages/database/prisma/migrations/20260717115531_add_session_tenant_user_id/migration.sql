/*
  Warnings:

  - Added the required column `tenant_user_id` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "tenant_user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "sessions_tenant_user_id_idx" ON "sessions"("tenant_user_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_user_id_fkey" FOREIGN KEY ("tenant_user_id") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
