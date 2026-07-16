-- Sprint 0 baseline migration.
-- Creates only the technical placeholder table required to keep `prisma generate`
-- functional with zero product tables. No product/feature tables are introduced.

-- CreateTable
CREATE TABLE "_schema_bootstrap" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "_schema_bootstrap_pkey" PRIMARY KEY ("id")
);
