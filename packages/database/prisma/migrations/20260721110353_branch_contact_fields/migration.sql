-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "email" TEXT,
ADD COLUMN     "google_maps_link" TEXT,
ADD COLUMN     "working_hours" JSONB;
