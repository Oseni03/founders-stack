/*
  Warnings:

  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `Branch` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `Commit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `DeploymentEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `Issue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `MessageThread` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `PullRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `UserReport` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Branch_externalId_sourceTool_idx" ON "public"."Branch"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_externalId_sourceTool_key" ON "public"."Branch"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "Commit_externalId_sourceTool_key" ON "public"."Commit"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Customer_externalId_sourceTool_idx" ON "public"."Customer"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_externalId_sourceTool_key" ON "public"."Customer"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "DeploymentEvent_externalId_sourceTool_idx" ON "public"."DeploymentEvent"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentEvent_externalId_sourceTool_key" ON "public"."DeploymentEvent"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Issue_externalId_sourceTool_idx" ON "public"."Issue"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_externalId_sourceTool_key" ON "public"."Issue"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "MessageThread_externalId_sourceTool_idx" ON "public"."MessageThread"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "MessageThread_externalId_sourceTool_key" ON "public"."MessageThread"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "PullRequest_externalId_sourceTool_idx" ON "public"."PullRequest"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_externalId_sourceTool_key" ON "public"."PullRequest"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Repository_externalId_sourceTool_idx" ON "public"."Repository"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_externalId_sourceTool_key" ON "public"."Repository"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "Task_externalId_sourceTool_key" ON "public"."Task"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Transaction_externalId_sourceTool_idx" ON "public"."Transaction"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_externalId_sourceTool_key" ON "public"."Transaction"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "UserReport_externalId_sourceTool_idx" ON "public"."UserReport"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "UserReport_externalId_sourceTool_key" ON "public"."UserReport"("externalId", "sourceTool");
