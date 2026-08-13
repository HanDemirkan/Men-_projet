-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "storefront_config",
DROP COLUMN "storefront_config_draft",
DROP COLUMN "storefront_published_at",
ADD COLUMN     "tagline" TEXT;

-- CreateTable
CREATE TABLE "tenant_storefront_configs" (
    "tenant_id" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL,
    "draft_config" JSONB NOT NULL,
    "published_config" JSONB,
    "published_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_storefront_configs_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "storefront_config_revisions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_code" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storefront_config_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storefront_config_revisions_tenant_id_published_at_idx" ON "storefront_config_revisions"("tenant_id", "published_at");

-- AddForeignKey
ALTER TABLE "tenant_storefront_configs" ADD CONSTRAINT "tenant_storefront_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_config_revisions" ADD CONSTRAINT "storefront_config_revisions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

