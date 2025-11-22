/*
  Warnings:

  - A unique constraint covering the columns `[externalId,platform,organizationId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Message_externalId_platform_organizationId_idx";

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalId_platform_organizationId_key" ON "public"."Message"("externalId", "platform", "organizationId");
