/*
  Warnings:

  - You are about to drop the column `lastSyncedAt` on the `UserReport` table. All the data in the column will be lost.
  - You are about to drop the column `sentiment` on the `UserReport` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `UserReport` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,toolName]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId]` on the table `UserReport` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timestamp` to the `UserReport` table without a default value. This is not possible if the table is not empty.
  - Made the column `userMetadata` on table `UserReport` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Integration_organizationId_toolName_idx";

-- DropIndex
DROP INDEX "public"."UserReport_organizationId_sentiment_idx";

-- AlterTable
ALTER TABLE "public"."UserReport" DROP COLUMN "lastSyncedAt",
DROP COLUMN "sentiment",
DROP COLUMN "severity",
ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "relatedTaskId" TEXT,
ADD COLUMN     "relatedTransactionId" TEXT,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "userMetadata" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."account" ADD COLUMN     "apiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Integration_organizationId_toolName_key" ON "public"."Integration"("organizationId", "toolName");

-- CreateIndex
CREATE UNIQUE INDEX "UserReport_organizationId_key" ON "public"."UserReport"("organizationId");

-- AddForeignKey
ALTER TABLE "public"."UserReport" ADD CONSTRAINT "UserReport_relatedTransactionId_fkey" FOREIGN KEY ("relatedTransactionId") REFERENCES "public"."Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
