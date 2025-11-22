/*
  Warnings:

  - You are about to drop the column `attributes` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `committedAt` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `committerName` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `sha` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `sourceTool` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `toolName` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `attributes` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `sourceTool` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `user` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `attributes` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `avgReviewTime` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `baseBranch` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `headBranch` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `isDraft` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStatus` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `reviewerIds` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `sourceTool` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `PullRequest` table. All the data in the column will be lost.
  - You are about to drop the column `attributes` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `owner` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `sourceTool` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `assignee` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `attributes` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `sourceTool` on the `Task` table. All the data in the column will be lost.
  - The `priority` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `sourceTool` on the `Webhook` table. All the data in the column will be lost.
  - You are about to drop the `AnalyticsEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Balance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Branch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CDMRecentSearches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DeploymentEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Feed` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinanceSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Issue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RepositoryHealth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPreferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contributor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[repositoryId,externalId]` on the table `Commit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,platform]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,platform]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId,integrationId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[repositoryId,externalId]` on the table `PullRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,platform]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,externalId,integrationId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,platform]` on the table `Webhook` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timestamp` to the `Commit` table without a default value. This is not possible if the table is not empty.
  - Made the column `additions` on table `Commit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `authorName` on table `Commit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `deletions` on table `Commit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `authorEmail` on table `Commit` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `platform` to the `Integration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorName` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channelName` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channelType` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `integrationId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorName` to the `PullRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceBranch` to the `PullRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `PullRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetBranch` to the `PullRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `integrationId` to the `Repository` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platform` to the `Repository` table without a default value. This is not possible if the table is not empty.
  - Made the column `defaultBranch` on table `Repository` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fullName` on table `Repository` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `integrationId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `platform` to the `Webhook` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER', 'GUEST');

-- DropForeignKey
ALTER TABLE "public"."AnalyticsEvent" DROP CONSTRAINT "AnalyticsEvent_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AnalyticsEvent" DROP CONSTRAINT "AnalyticsEvent_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Balance" DROP CONSTRAINT "Balance_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Branch" DROP CONSTRAINT "Branch_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Branch" DROP CONSTRAINT "Branch_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Commit" DROP CONSTRAINT "Commit_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Customer" DROP CONSTRAINT "Customer_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DeploymentEvent" DROP CONSTRAINT "DeploymentEvent_commitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DeploymentEvent" DROP CONSTRAINT "DeploymentEvent_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DeploymentEvent" DROP CONSTRAINT "DeploymentEvent_relatedTaskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Event" DROP CONSTRAINT "Event_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Feed" DROP CONSTRAINT "Feed_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Feed" DROP CONSTRAINT "Feed_taskId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FinanceSubscription" DROP CONSTRAINT "FinanceSubscription_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FinanceSubscription" DROP CONSTRAINT "FinanceSubscription_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Invoice" DROP CONSTRAINT "Invoice_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Issue" DROP CONSTRAINT "Issue_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Issue" DROP CONSTRAINT "Issue_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Project" DROP CONSTRAINT "Project_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PullRequest" DROP CONSTRAINT "PullRequest_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RepositoryHealth" DROP CONSTRAINT "RepositoryHealth_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RepositoryHealth" DROP CONSTRAINT "RepositoryHealth_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contributor" DROP CONSTRAINT "contributor_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."contributor" DROP CONSTRAINT "contributor_repositoryId_fkey";

-- DropIndex
DROP INDEX "public"."Commit_externalId_sourceTool_idx";

-- DropIndex
DROP INDEX "public"."Commit_externalId_sourceTool_key";

-- DropIndex
DROP INDEX "public"."Commit_organizationId_committedAt_idx";

-- DropIndex
DROP INDEX "public"."Integration_organizationId_toolName_key";

-- DropIndex
DROP INDEX "public"."Message_channelId_idx";

-- DropIndex
DROP INDEX "public"."Message_externalId_sourceTool_key";

-- DropIndex
DROP INDEX "public"."Message_externalId_sourceTool_organizationId_idx";

-- DropIndex
DROP INDEX "public"."PullRequest_externalId_sourceTool_idx";

-- DropIndex
DROP INDEX "public"."PullRequest_externalId_sourceTool_key";

-- DropIndex
DROP INDEX "public"."PullRequest_organizationId_status_idx";

-- DropIndex
DROP INDEX "public"."Repository_externalId_sourceTool_idx";

-- DropIndex
DROP INDEX "public"."Repository_externalId_sourceTool_key";

-- DropIndex
DROP INDEX "public"."Task_assigneeId_dueDate_idx";

-- DropIndex
DROP INDEX "public"."Task_externalId_sourceTool_key";

-- DropIndex
DROP INDEX "public"."Task_organizationId_projectId_status_idx";

-- DropIndex
DROP INDEX "public"."Task_organizationId_status_priority_idx";

-- DropIndex
DROP INDEX "public"."Webhook_externalId_sourceTool_key";

-- AlterTable
ALTER TABLE "public"."Commit" DROP COLUMN "attributes",
DROP COLUMN "avatarUrl",
DROP COLUMN "committedAt",
DROP COLUMN "committerName",
DROP COLUMN "createdAt",
DROP COLUMN "organizationId",
DROP COLUMN "sha",
DROP COLUMN "sourceTool",
DROP COLUMN "total",
DROP COLUMN "updatedAt",
ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "filesChanged" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "additions" SET NOT NULL,
ALTER COLUMN "additions" SET DEFAULT 0,
ALTER COLUMN "authorName" SET NOT NULL,
ALTER COLUMN "deletions" SET NOT NULL,
ALTER COLUMN "deletions" SET DEFAULT 0,
ALTER COLUMN "authorEmail" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Integration" DROP COLUMN "toolName",
ADD COLUMN     "platform" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "attributes",
DROP COLUMN "createdAt",
DROP COLUMN "sourceTool",
DROP COLUMN "text",
DROP COLUMN "updatedAt",
DROP COLUMN "user",
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "authorAvatar" TEXT,
ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "authorName" TEXT NOT NULL,
ADD COLUMN     "channelName" TEXT NOT NULL,
ADD COLUMN     "channelType" TEXT NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "integrationId" TEXT NOT NULL,
ADD COLUMN     "isImportant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentions" TEXT[],
ADD COLUMN     "parentMessageId" TEXT,
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "reactions" JSONB,
ADD COLUMN     "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "threadId" TEXT,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "public"."PullRequest" DROP COLUMN "attributes",
DROP COLUMN "avgReviewTime",
DROP COLUMN "baseBranch",
DROP COLUMN "headBranch",
DROP COLUMN "isDraft",
DROP COLUMN "organizationId",
DROP COLUMN "reviewStatus",
DROP COLUMN "reviewerIds",
DROP COLUMN "sourceTool",
DROP COLUMN "status",
ADD COLUMN     "additions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "authorAvatar" TEXT,
ADD COLUMN     "authorName" TEXT NOT NULL,
ADD COLUMN     "changedFiles" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "deletions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "labels" TEXT[],
ADD COLUMN     "reviewers" JSONB,
ADD COLUMN     "sourceBranch" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "targetBranch" TEXT NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Repository" DROP COLUMN "attributes",
DROP COLUMN "isArchived",
DROP COLUMN "owner",
DROP COLUMN "sourceTool",
ADD COLUMN     "integrationId" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "openIssues" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "openPRs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "stars" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "defaultBranch" SET NOT NULL,
ALTER COLUMN "defaultBranch" SET DEFAULT 'main',
ALTER COLUMN "fullName" SET NOT NULL,
ALTER COLUMN "isPrivate" SET DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "assignee",
DROP COLUMN "attributes",
DROP COLUMN "lastSyncedAt",
DROP COLUMN "sourceTool",
ADD COLUMN     "actualHours" DOUBLE PRECISION,
ADD COLUMN     "assigneeAvatar" TEXT,
ADD COLUMN     "assigneeName" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dependencies" TEXT[],
ADD COLUMN     "epicId" TEXT,
ADD COLUMN     "epicName" TEXT,
ADD COLUMN     "estimatedHours" DOUBLE PRECISION,
ADD COLUMN     "integrationId" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "parentTaskId" TEXT,
ADD COLUMN     "projectName" TEXT,
ADD COLUMN     "reporterId" TEXT,
ADD COLUMN     "reporterName" TEXT,
ADD COLUMN     "sprintId" TEXT,
ADD COLUMN     "sprintName" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "storyPoints" INTEGER,
ADD COLUMN     "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL,
DROP COLUMN "priority",
ADD COLUMN     "priority" TEXT,
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Webhook" DROP COLUMN "sourceTool",
ADD COLUMN     "platform" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."organization" ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE';

-- DropTable
DROP TABLE "public"."AnalyticsEvent";

-- DropTable
DROP TABLE "public"."Balance";

-- DropTable
DROP TABLE "public"."Branch";

-- DropTable
DROP TABLE "public"."CDMRecentSearches";

-- DropTable
DROP TABLE "public"."Customer";

-- DropTable
DROP TABLE "public"."DeploymentEvent";

-- DropTable
DROP TABLE "public"."Event";

-- DropTable
DROP TABLE "public"."Feed";

-- DropTable
DROP TABLE "public"."FinanceSubscription";

-- DropTable
DROP TABLE "public"."Invoice";

-- DropTable
DROP TABLE "public"."Issue";

-- DropTable
DROP TABLE "public"."Project";

-- DropTable
DROP TABLE "public"."RepositoryHealth";

-- DropTable
DROP TABLE "public"."UserPreferences";

-- DropTable
DROP TABLE "public"."contributor";

-- DropEnum
DROP TYPE "public"."Sentiment";

-- DropEnum
DROP TYPE "public"."Severity";

-- DropEnum
DROP TYPE "public"."Status";

-- CreateTable
CREATE TABLE "public"."OrganizationSettings" (
    "id" TEXT NOT NULL,
    "allowMembersToAddIntegrations" BOOLEAN NOT NULL DEFAULT false,
    "requireApprovalForIntegrations" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "allowDataExport" BOOLEAN NOT NULL DEFAULT true,
    "allowGuestAccess" BOOLEAN NOT NULL DEFAULT false,
    "requireMFAForAdmins" BOOLEAN NOT NULL DEFAULT false,
    "defaultNotificationSettings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPreference" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "defaultOrganizationId" TEXT,
    "notificationSettings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskWatcher" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskWatcher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "excerpt" TEXT,
    "type" TEXT,
    "parentId" TEXT,
    "path" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "lastEditorId" TEXT,
    "lastEditorName" TEXT,
    "url" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "status" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeedbackItem" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "priority" TEXT,
    "sentiment" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "category" TEXT,
    "tags" TEXT[],
    "votes" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "userSegment" TEXT,
    "assignedTo" TEXT,
    "linkedFeature" TEXT,
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "FeedbackItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DesignFile" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "fileType" TEXT,
    "url" TEXT,
    "thumbnailUrl" TEXT,
    "status" TEXT,
    "version" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "lastEditorId" TEXT,
    "lastEditorName" TEXT,
    "projectId" TEXT,
    "projectName" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "DesignFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsData" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "metricUnit" TEXT,
    "dimension" TEXT,
    "dimensionValue" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "granularity" TEXT NOT NULL,
    "metadata" JSONB,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "AnalyticsData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Build" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "buildNumber" INTEGER,
    "branch" TEXT,
    "commitSha" TEXT,
    "triggeredBy" TEXT,
    "duration" INTEGER,
    "url" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportTicket" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT,
    "type" TEXT,
    "channel" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "teamId" TEXT,
    "teamName" TEXT,
    "tags" TEXT[],
    "slaStatus" TEXT,
    "satisfactionScore" INTEGER,
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "reactions" JSONB DEFAULT '{}',
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LinkedItem" (
    "id" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "linkType" TEXT,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "layout" JSONB NOT NULL,
    "filters" JSONB,
    "createdBy" TEXT NOT NULL,
    "sharedWith" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "CustomView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "entityType" TEXT,
    "entityId" TEXT,
    "actionUrl" TEXT,
    "actionText" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "userId" TEXT,
    "actorName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organizationId_key" ON "public"."OrganizationSettings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "public"."UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskWatcher_taskId_userId_key" ON "public"."TaskWatcher"("taskId", "userId");

-- CreateIndex
CREATE INDEX "Document_organizationId_title_idx" ON "public"."Document"("organizationId", "title");

-- CreateIndex
CREATE INDEX "Document_organizationId_updatedAt_idx" ON "public"."Document"("organizationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_organizationId_externalId_integrationId_key" ON "public"."Document"("organizationId", "externalId", "integrationId");

-- CreateIndex
CREATE INDEX "FeedbackItem_organizationId_type_status_idx" ON "public"."FeedbackItem"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "FeedbackItem_organizationId_idx" ON "public"."FeedbackItem"("organizationId");

-- CreateIndex
CREATE INDEX "FeedbackItem_status_idx" ON "public"."FeedbackItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackItem_externalId_platform_key" ON "public"."FeedbackItem"("externalId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackItem_organizationId_externalId_integrationId_key" ON "public"."FeedbackItem"("organizationId", "externalId", "integrationId");

-- CreateIndex
CREATE INDEX "DesignFile_organizationId_status_idx" ON "public"."DesignFile"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DesignFile_organizationId_updatedAt_idx" ON "public"."DesignFile"("organizationId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DesignFile_organizationId_externalId_integrationId_key" ON "public"."DesignFile"("organizationId", "externalId", "integrationId");

-- CreateIndex
CREATE INDEX "AnalyticsData_organizationId_metricName_timestamp_idx" ON "public"."AnalyticsData"("organizationId", "metricName", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsData_organizationId_integrationId_metricName_dimen_key" ON "public"."AnalyticsData"("organizationId", "integrationId", "metricName", "dimension", "dimensionValue", "timestamp");

-- CreateIndex
CREATE INDEX "Build_repositoryId_status_idx" ON "public"."Build"("repositoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Build_repositoryId_externalId_key" ON "public"."Build"("repositoryId", "externalId");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_status_priority_idx" ON "public"."SupportTicket"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_slaStatus_idx" ON "public"."SupportTicket"("organizationId", "slaStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_organizationId_externalId_integrationId_key" ON "public"."SupportTicket"("organizationId", "externalId", "integrationId");

-- CreateIndex
CREATE INDEX "Comment_organizationId_entityType_entityId_idx" ON "public"."Comment"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "public"."Comment"("authorId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "public"."Comment"("createdAt");

-- CreateIndex
CREATE INDEX "LinkedItem_sourceType_sourceId_idx" ON "public"."LinkedItem"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "LinkedItem_targetType_targetId_idx" ON "public"."LinkedItem"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedItem_sourceType_sourceId_targetType_targetId_key" ON "public"."LinkedItem"("sourceType", "sourceId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "CustomView_organizationId_visibility_idx" ON "public"."CustomView"("organizationId", "visibility");

-- CreateIndex
CREATE INDEX "CustomView_createdBy_idx" ON "public"."CustomView"("createdBy");

-- CreateIndex
CREATE INDEX "Notification_userId_organizationId_isRead_idx" ON "public"."Notification"("userId", "organizationId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_timestamp_idx" ON "public"."ActivityLog"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_timestamp_idx" ON "public"."ActivityLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "public"."ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Commit_repositoryId_timestamp_idx" ON "public"."Commit"("repositoryId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Commit_repositoryId_externalId_key" ON "public"."Commit"("repositoryId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_organizationId_platform_key" ON "public"."Integration"("organizationId", "platform");

-- CreateIndex
CREATE INDEX "Message_externalId_platform_organizationId_idx" ON "public"."Message"("externalId", "platform", "organizationId");

-- CreateIndex
CREATE INDEX "Message_organizationId_channelId_idx" ON "public"."Message"("organizationId", "channelId");

-- CreateIndex
CREATE INDEX "Message_organizationId_timestamp_idx" ON "public"."Message"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "Message_channelId_timestamp_idx" ON "public"."Message"("channelId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalId_platform_key" ON "public"."Message"("externalId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "Message_organizationId_externalId_integrationId_key" ON "public"."Message"("organizationId", "externalId", "integrationId");

-- CreateIndex
CREATE INDEX "PullRequest_repositoryId_state_idx" ON "public"."PullRequest"("repositoryId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_repositoryId_externalId_key" ON "public"."PullRequest"("repositoryId", "externalId");

-- CreateIndex
CREATE INDEX "Repository_externalId_platform_idx" ON "public"."Repository"("externalId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_externalId_platform_key" ON "public"."Repository"("externalId", "platform");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_idx" ON "public"."Task"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Task_organizationId_assigneeId_idx" ON "public"."Task"("organizationId", "assigneeId");

-- CreateIndex
CREATE INDEX "Task_organizationId_dueDate_idx" ON "public"."Task"("organizationId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "public"."Task"("projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Task_organizationId_externalId_integrationId_key" ON "public"."Task"("organizationId", "externalId", "integrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_externalId_platform_key" ON "public"."Webhook"("externalId", "platform");

-- AddForeignKey
ALTER TABLE "public"."OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskWatcher" ADD CONSTRAINT "TaskWatcher_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeedbackItem" ADD CONSTRAINT "FeedbackItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeedbackItem" ADD CONSTRAINT "FeedbackItem_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignFile" ADD CONSTRAINT "DesignFile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DesignFile" ADD CONSTRAINT "DesignFile_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsData" ADD CONSTRAINT "AnalyticsData_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsData" ADD CONSTRAINT "AnalyticsData_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Build" ADD CONSTRAINT "Build_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "fk_comment_to_task" FOREIGN KEY ("entityId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "fk_comment_to_message" FOREIGN KEY ("entityId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "fk_comment_to_document" FOREIGN KEY ("entityId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "fk_comment_to_feedback" FOREIGN KEY ("entityId") REFERENCES "public"."FeedbackItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "fk_comment_to_design" FOREIGN KEY ("entityId") REFERENCES "public"."DesignFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "fk_comment_to_pr" FOREIGN KEY ("entityId") REFERENCES "public"."PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "fk_comment_to_ticket" FOREIGN KEY ("entityId") REFERENCES "public"."SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_task" FOREIGN KEY ("sourceId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_message" FOREIGN KEY ("sourceId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_document" FOREIGN KEY ("sourceId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_feedback" FOREIGN KEY ("sourceId") REFERENCES "public"."FeedbackItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_design" FOREIGN KEY ("sourceId") REFERENCES "public"."DesignFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_pr" FOREIGN KEY ("sourceId") REFERENCES "public"."PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_ticket" FOREIGN KEY ("sourceId") REFERENCES "public"."SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomView" ADD CONSTRAINT "CustomView_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomView" ADD CONSTRAINT "CustomView_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
