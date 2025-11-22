/*
  Warnings:

  - The values [INTEGRATION,MEMBER] on the enum `EntityType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `integrationId` on the `AnalyticsData` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `DesignFile` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `FeedbackItem` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `SupportTicket` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,metricName,dimension,dimensionValue,timestamp]` on the table `AnalyticsData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId]` on the table `DesignFile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId]` on the table `FeedbackItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,platform]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId]` on the table `SupportTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `sourceType` on the `LinkedItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `platform` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `member` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."EntityType_new" AS ENUM ('TASK', 'MESSAGE', 'DOCUMENT', 'FEEDBACK', 'DESIGN', 'PR', 'TICKET');
ALTER TABLE "public"."Comment" ALTER COLUMN "entityType" TYPE "public"."EntityType_new" USING ("entityType"::text::"public"."EntityType_new");
ALTER TABLE "public"."LinkedItem" ALTER COLUMN "sourceType" TYPE "public"."EntityType_new" USING ("sourceType"::text::"public"."EntityType_new");
ALTER TABLE "public"."Notification" ALTER COLUMN "entityType" TYPE "public"."EntityType_new" USING ("entityType"::text::"public"."EntityType_new");
ALTER TABLE "public"."ActivityLog" ALTER COLUMN "entityType" TYPE "public"."EntityType_new" USING ("entityType"::text::"public"."EntityType_new");
ALTER TYPE "public"."EntityType" RENAME TO "EntityType_old";
ALTER TYPE "public"."EntityType_new" RENAME TO "EntityType";
DROP TYPE "public"."EntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."AnalyticsData" DROP CONSTRAINT "AnalyticsData_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DesignFile" DROP CONSTRAINT "DesignFile_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FeedbackItem" DROP CONSTRAINT "FeedbackItem_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Repository" DROP CONSTRAINT "Repository_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SupportTicket" DROP CONSTRAINT "SupportTicket_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_integrationId_fkey";

-- DropIndex
DROP INDEX "public"."AnalyticsData_organizationId_integrationId_metricName_dimen_key";

-- DropIndex
DROP INDEX "public"."DesignFile_organizationId_externalId_integrationId_key";

-- DropIndex
DROP INDEX "public"."Document_organizationId_externalId_integrationId_key";

-- DropIndex
DROP INDEX "public"."FeedbackItem_organizationId_externalId_integrationId_key";

-- DropIndex
DROP INDEX "public"."Message_organizationId_externalId_integrationId_key";

-- DropIndex
DROP INDEX "public"."SupportTicket_organizationId_externalId_integrationId_key";

-- DropIndex
DROP INDEX "public"."Task_organizationId_externalId_integrationId_key";

-- AlterTable
ALTER TABLE "public"."AnalyticsData" DROP COLUMN "integrationId";

-- AlterTable
ALTER TABLE "public"."DesignFile" DROP COLUMN "integrationId";

-- AlterTable
ALTER TABLE "public"."Document" DROP COLUMN "integrationId";

-- AlterTable
ALTER TABLE "public"."FeedbackItem" DROP COLUMN "integrationId";

-- AlterTable
ALTER TABLE "public"."LinkedItem" DROP COLUMN "sourceType",
ADD COLUMN     "sourceType" "public"."EntityType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "integrationId";

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "public"."Repository" DROP COLUMN "integrationId";

-- AlterTable
ALTER TABLE "public"."SupportTicket" DROP COLUMN "integrationId";

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "integrationId",
DROP COLUMN "metadata",
ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "platform" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."member" DROP COLUMN "role",
ADD COLUMN     "role" "public"."Role" NOT NULL;

-- DropEnum
DROP TYPE "public"."SourceType";

-- CreateTable
CREATE TABLE "public"."integration_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "integration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_logs" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "recordsSynced" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsData_organizationId_metricName_dimension_dimension_key" ON "public"."AnalyticsData"("organizationId", "metricName", "dimension", "dimensionValue", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DesignFile_organizationId_externalId_key" ON "public"."DesignFile"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_organizationId_externalId_key" ON "public"."Document"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackItem_organizationId_externalId_key" ON "public"."FeedbackItem"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "LinkedItem_sourceType_sourceId_idx" ON "public"."LinkedItem"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedItem_sourceType_sourceId_targetType_targetId_key" ON "public"."LinkedItem"("sourceType", "sourceId", "targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_organizationId_externalId_key" ON "public"."Message"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_platform_key" ON "public"."Project"("organizationId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_organizationId_externalId_key" ON "public"."SupportTicket"("organizationId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_organizationId_externalId_key" ON "public"."Task"("organizationId", "externalId");

-- AddForeignKey
ALTER TABLE "public"."integration_requests" ADD CONSTRAINT "integration_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sync_logs" ADD CONSTRAINT "sync_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
