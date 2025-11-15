/*
  Warnings:

  - You are about to drop the column `projectName` on the `DesignFile` table. All the data in the column will be lost.
  - You are about to drop the column `projectName` on the `Task` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[externalId,platform]` on the table `DesignFile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `platform` to the `DesignFile` table without a default value. This is not possible if the table is not empty.
  - Made the column `projectId` on table `DesignFile` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `projectId` to the `FeedbackItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Made the column `projectId` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."AnalyticsData" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "public"."DesignFile" DROP COLUMN "projectName",
ADD COLUMN     "platform" TEXT NOT NULL,
ALTER COLUMN "projectId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."FeedbackItem" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "projectName",
ALTER COLUMN "projectId" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalId" TEXT,
    "platform" TEXT,
    "attributes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_organizationId_status_idx" ON "public"."Project"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_externalId_platform_key" ON "public"."Project"("externalId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "DesignFile_externalId_platform_key" ON "public"."DesignFile"("externalId", "platform");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeedbackItem" ADD CONSTRAINT "FeedbackItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignFile" ADD CONSTRAINT "DesignFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsData" ADD CONSTRAINT "AnalyticsData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
