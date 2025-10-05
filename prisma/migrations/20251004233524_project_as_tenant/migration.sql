/*
  Warnings:

  - The values [todo,in_progress,review,done,blocked,cancelled] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `channels` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `condition` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `lastTriggeredAt` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `triggerCount` on the `Alert` table. All the data in the column will be lost.
  - You are about to alter the column `threshold` on the `Alert` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,4)` to `DoublePrecision`.
  - You are about to drop the column `config` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `syncEnabled` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `assignee` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `sourceUrl` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `customerEmail` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `integrationId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `sourceUrl` on the `Transaction` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Decimal(19,4)` to `DoublePrecision`.
  - You are about to drop the `AlertLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CodeActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metric` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `message` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Alert` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `toolName` to the `Integration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceTool` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceTool` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TaskStatus_new" AS ENUM ('open', 'closed');
ALTER TABLE "public"."Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Task" ALTER COLUMN "status" TYPE "public"."TaskStatus_new" USING ("status"::text::"public"."TaskStatus_new");
ALTER TYPE "public"."TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "public"."TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Alert" DROP CONSTRAINT "Alert_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AlertLog" DROP CONSTRAINT "AlertLog_alertId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CodeActivity" DROP CONSTRAINT "CodeActivity_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CodeActivity" DROP CONSTRAINT "CodeActivity_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Metric" DROP CONSTRAINT "Metric_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Metric" DROP CONSTRAINT "Metric_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_integrationId_fkey";

-- DropIndex
DROP INDEX "public"."Alert_organizationId_idx";

-- DropIndex
DROP INDEX "public"."Alert_organizationId_isActive_idx";

-- DropIndex
DROP INDEX "public"."Alert_userId_idx";

-- DropIndex
DROP INDEX "public"."Integration_organizationId_idx";

-- DropIndex
DROP INDEX "public"."Task_assignee_idx";

-- DropIndex
DROP INDEX "public"."Task_integrationId_externalId_key";

-- DropIndex
DROP INDEX "public"."Task_integrationId_idx";

-- DropIndex
DROP INDEX "public"."Task_organizationId_dueDate_idx";

-- DropIndex
DROP INDEX "public"."Task_organizationId_idx";

-- DropIndex
DROP INDEX "public"."Task_organizationId_priority_idx";

-- DropIndex
DROP INDEX "public"."Task_organizationId_status_idx";

-- DropIndex
DROP INDEX "public"."Transaction_customerEmail_idx";

-- DropIndex
DROP INDEX "public"."Transaction_customerId_idx";

-- DropIndex
DROP INDEX "public"."Transaction_integrationId_externalId_key";

-- DropIndex
DROP INDEX "public"."Transaction_integrationId_idx";

-- DropIndex
DROP INDEX "public"."Transaction_organizationId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."Transaction_organizationId_idx";

-- DropIndex
DROP INDEX "public"."Transaction_organizationId_status_idx";

-- AlterTable
ALTER TABLE "public"."Alert" DROP COLUMN "channels",
DROP COLUMN "condition",
DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "lastTriggeredAt",
DROP COLUMN "name",
DROP COLUMN "triggerCount",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "relatedEntityId" TEXT,
ADD COLUMN     "relatedEntityType" TEXT,
ADD COLUMN     "status" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "threshold" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Integration" DROP COLUMN "config",
DROP COLUMN "errorMessage",
DROP COLUMN "syncEnabled",
ADD COLUMN     "syncInterval" INTEGER,
ADD COLUMN     "toolName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "assignee",
DROP COLUMN "completedAt",
DROP COLUMN "description",
DROP COLUMN "integrationId",
DROP COLUMN "metadata",
DROP COLUMN "sourceUrl",
DROP COLUMN "title",
ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "labels" TEXT[],
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "parentProjectId" TEXT,
ADD COLUMN     "relatedTaskId" TEXT,
ADD COLUMN     "sourceTool" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "priority" DROP NOT NULL,
ALTER COLUMN "priority" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "description",
DROP COLUMN "integrationId",
DROP COLUMN "metadata",
DROP COLUMN "processedAt",
DROP COLUMN "sourceUrl",
ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "sourceTool" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "status" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."AlertLog";

-- DropTable
DROP TABLE "public"."CodeActivity";

-- DropTable
DROP TABLE "public"."Metric";

-- DropEnum
DROP TYPE "public"."AlertChannel";

-- DropEnum
DROP TYPE "public"."AlertType";

-- DropEnum
DROP TYPE "public"."CodeActivityType";

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "public"."MessageThread" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "participants" TEXT[],
    "relatedTaskId" TEXT,
    "lastMessageTimestamp" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "sentimentScore" DOUBLE PRECISION,
    "attributes" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeploymentEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "commitHash" TEXT,
    "status" TEXT NOT NULL,
    "environment" TEXT,
    "errorLogSummary" TEXT,
    "buildDuration" INTEGER,
    "deployedAt" TIMESTAMP(3),
    "relatedTaskId" TEXT,
    "attributes" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "commitId" TEXT,

    CONSTRAINT "DeploymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "planTier" TEXT,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserReport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "severity" TEXT,
    "sourceUrl" TEXT,
    "sentiment" TEXT,
    "userMetadata" JSONB,
    "pageViews" INTEGER,
    "conversionRate" DOUBLE PRECISION,
    "attributes" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Repository" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "authorId" TEXT,
    "committedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PullRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reviewStatus" TEXT,
    "mergedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "reviewerIds" TEXT[],
    "avgReviewTime" DOUBLE PRECISION,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Issue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "authorId" TEXT,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branch" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastCommitAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "commitsAhead" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RepositoryHealth" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "healthScore" INTEGER NOT NULL DEFAULT 0,
    "openIssues" INTEGER NOT NULL DEFAULT 0,
    "stalePrs" INTEGER NOT NULL DEFAULT 0,
    "avgReviewTime" DOUBLE PRECISION,
    "testCoverage" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryHealth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageThread_organizationId_relatedTaskId_idx" ON "public"."MessageThread"("organizationId", "relatedTaskId");

-- CreateIndex
CREATE INDEX "DeploymentEvent_organizationId_status_idx" ON "public"."DeploymentEvent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Customer_organizationId_email_idx" ON "public"."Customer"("organizationId", "email");

-- CreateIndex
CREATE INDEX "UserReport_organizationId_sentiment_idx" ON "public"."UserReport"("organizationId", "sentiment");

-- CreateIndex
CREATE INDEX "Repository_organizationId_name_idx" ON "public"."Repository"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Commit_organizationId_committedAt_idx" ON "public"."Commit"("organizationId", "committedAt");

-- CreateIndex
CREATE INDEX "PullRequest_organizationId_status_idx" ON "public"."PullRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Issue_organizationId_status_idx" ON "public"."Issue"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Branch_organizationId_name_idx" ON "public"."Branch"("organizationId", "name");

-- CreateIndex
CREATE INDEX "RepositoryHealth_organizationId_repositoryId_idx" ON "public"."RepositoryHealth"("organizationId", "repositoryId");

-- CreateIndex
CREATE INDEX "Alert_organizationId_type_idx" ON "public"."Alert"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Integration_organizationId_toolName_idx" ON "public"."Integration"("organizationId", "toolName");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_priority_idx" ON "public"."Task"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "Task_externalId_sourceTool_idx" ON "public"."Task"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_date_status_idx" ON "public"."Transaction"("organizationId", "date", "status");

-- AddForeignKey
ALTER TABLE "public"."MessageThread" ADD CONSTRAINT "MessageThread_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageThread" ADD CONSTRAINT "MessageThread_relatedTaskId_fkey" FOREIGN KEY ("relatedTaskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeploymentEvent" ADD CONSTRAINT "DeploymentEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeploymentEvent" ADD CONSTRAINT "DeploymentEvent_relatedTaskId_fkey" FOREIGN KEY ("relatedTaskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeploymentEvent" ADD CONSTRAINT "DeploymentEvent_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "public"."Commit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserReport" ADD CONSTRAINT "UserReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commit" ADD CONSTRAINT "Commit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commit" ADD CONSTRAINT "Commit_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PullRequest" ADD CONSTRAINT "PullRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PullRequest" ADD CONSTRAINT "PullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Issue" ADD CONSTRAINT "Issue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepositoryHealth" ADD CONSTRAINT "RepositoryHealth_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepositoryHealth" ADD CONSTRAINT "RepositoryHealth_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
