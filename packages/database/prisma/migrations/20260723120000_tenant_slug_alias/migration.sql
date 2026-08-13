-- CreateTable
CREATE TABLE "tenant_slug_aliases" (
    "old_slug" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_slug_aliases_pkey" PRIMARY KEY ("old_slug")
);

-- CreateIndex
CREATE INDEX "tenant_slug_aliases_tenant_id_idx" ON "tenant_slug_aliases"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_slug_aliases" ADD CONSTRAINT "tenant_slug_aliases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

