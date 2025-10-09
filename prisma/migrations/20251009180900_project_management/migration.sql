/*
  Warnings:

  - The values [oauth] on the enum `IntegrationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `externalLink` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `parentProjectId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `relatedTaskId` on the `Task` table. All the data in the column will be lost.
  - The primary key for the `UserPreferences` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId,providerId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."IntegrationType_new" AS ENUM ('oauth1a', 'oauth2', 'api_key');
ALTER TABLE "public"."Integration" ALTER COLUMN "type" TYPE "public"."IntegrationType_new" USING ("type"::text::"public"."IntegrationType_new");
ALTER TYPE "public"."IntegrationType" RENAME TO "IntegrationType_old";
ALTER TYPE "public"."IntegrationType_new" RENAME TO "IntegrationType";
DROP TYPE "public"."IntegrationType_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."Task_externalId_sourceTool_idx";

-- AlterTable
ALTER TABLE "public"."Integration" ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "type" SET DEFAULT 'oauth2';

-- AlterTable
ALTER TABLE "public"."Task" DROP COLUMN "externalLink",
DROP COLUMN "parentProjectId",
DROP COLUMN "relatedTaskId",
ADD COLUMN     "projectId" TEXT NOT NULL,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "public"."UserPreferences" DROP CONSTRAINT "UserPreferences_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalId" TEXT,
    "sourceTool" TEXT,
    "attributes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_organizationId_status_idx" ON "public"."Project"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_externalId_sourceTool_key" ON "public"."Project"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Task_organizationId_projectId_status_idx" ON "public"."Task"("organizationId", "projectId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_dueDate_idx" ON "public"."Task"("assigneeId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "account_userId_providerId_key" ON "public"."account"("userId", "providerId");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
