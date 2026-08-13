-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "business_settings" JSONB;

-- CreateTable
CREATE TABLE "storefront_views" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storefront_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storefront_views_tenant_id_idx" ON "storefront_views"("tenant_id");

-- CreateIndex
CREATE INDEX "storefront_views_created_at_idx" ON "storefront_views"("created_at");

-- AddForeignKey
ALTER TABLE "storefront_views" ADD CONSTRAINT "storefront_views_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
