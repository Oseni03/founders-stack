-- AlterTable
ALTER TABLE "public"."organization" ADD COLUMN     "maxNotes" INTEGER,
ADD COLUMN     "maxUsers" INTEGER,
ADD COLUMN     "subscription" TEXT;
