-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('Low', 'Medium', 'High');

-- CreateEnum
CREATE TYPE "public"."Sentiment" AS ENUM ('Positive', 'Negative', 'Neutral');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('Open', 'InProgress', 'Resolved');

-- CreateTable
CREATE TABLE "public"."Feed" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "authorId" TEXT,
    "owner" TEXT,
    "ownerId" TEXT,
    "category" TEXT,
    "url" TEXT,
    "tags" TEXT[],
    "score" INTEGER,
    "commentsCount" INTEGER,
    "status" TEXT NOT NULL,
    "attributes" JSONB,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feed_organizationId_idx" ON "public"."Feed"("organizationId");

-- CreateIndex
CREATE INDEX "Feed_projectId_idx" ON "public"."Feed"("projectId");

-- CreateIndex
CREATE INDEX "Feed_status_idx" ON "public"."Feed"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Feed_externalId_sourceTool_key" ON "public"."Feed"("externalId", "sourceTool");

-- AddForeignKey
ALTER TABLE "public"."Feed" ADD CONSTRAINT "Feed_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feed" ADD CONSTRAINT "Feed_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
