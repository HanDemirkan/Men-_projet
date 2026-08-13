/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,slug]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `categories` table without a default value. This is not possible if the table is not empty.
  - You are about to drop the column `theme` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `primary_color` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `secondary_color` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `accent_color` on the `tenants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "categories" ADD COLUMN "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "theme",
DROP COLUMN "primary_color",
DROP COLUMN "secondary_color",
DROP COLUMN "accent_color",
ADD COLUMN "storefront_config" JSONB,
ADD COLUMN "storefront_config_draft" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_slug_key" ON "categories"("tenant_id", "slug");
