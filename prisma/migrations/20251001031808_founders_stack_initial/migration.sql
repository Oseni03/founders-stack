-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "public"."IntegrationStatus" AS ENUM ('active', 'inactive', 'error', 'pending');

-- CreateEnum
CREATE TYPE "public"."IntegrationCategory" AS ENUM ('project_management', 'payment', 'analytics', 'version_control', 'communication', 'crm', 'other');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."CodeActivityType" AS ENUM ('commit', 'pull_request', 'merge', 'branch_created', 'branch_deleted', 'tag_created', 'release');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('task_overdue', 'transaction_threshold', 'metric_threshold', 'code_activity', 'integration_error', 'custom');

-- CreateEnum
CREATE TYPE "public"."AlertChannel" AS ENUM ('email', 'slack', 'webhook', 'in_app');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,
    "polarCustomerId" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3),
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "recurringInterval" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "customerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "productId" TEXT NOT NULL,
    "discountId" TEXT,
    "checkoutId" TEXT NOT NULL,
    "customerCancellationReason" TEXT,
    "customerCancellationComment" TEXT,
    "metadata" TEXT,
    "customFieldData" TEXT,
    "maxUsers" INTEGER NOT NULL DEFAULT 3,
    "maxNotes" INTEGER NOT NULL DEFAULT 50,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Integration" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "category" "public"."IntegrationCategory" NOT NULL,
    "status" "public"."IntegrationStatus" NOT NULL DEFAULT 'pending',
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "errorMessage" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'todo',
    "priority" "public"."TaskPriority" NOT NULL DEFAULT 'medium',
    "assignee" TEXT,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'pending',
    "customerId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "description" TEXT,
    "sourceUrl" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Metric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(19,4) NOT NULL,
    "unit" TEXT,
    "category" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CodeActivity" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" "public"."CodeActivityType" NOT NULL,
    "author" TEXT NOT NULL,
    "authorEmail" TEXT,
    "repository" TEXT NOT NULL,
    "branch" TEXT,
    "message" TEXT,
    "additions" INTEGER,
    "deletions" INTEGER,
    "sourceUrl" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "CodeActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Alert" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "description" TEXT,
    "threshold" DECIMAL(19,4),
    "condition" JSONB NOT NULL,
    "channels" "public"."AlertChannel"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AlertLog" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "triggered" BOOLEAN NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "public"."organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_organizationId_key" ON "public"."subscription"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_accountId_key" ON "public"."Integration"("accountId");

-- CreateIndex
CREATE INDEX "Integration_organizationId_idx" ON "public"."Integration"("organizationId");

-- CreateIndex
CREATE INDEX "Integration_organizationId_status_idx" ON "public"."Integration"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Integration_organizationId_category_idx" ON "public"."Integration"("organizationId", "category");

-- CreateIndex
CREATE INDEX "Integration_accountId_idx" ON "public"."Integration"("accountId");

-- CreateIndex
CREATE INDEX "Task_organizationId_idx" ON "public"."Task"("organizationId");

-- CreateIndex
CREATE INDEX "Task_integrationId_idx" ON "public"."Task"("integrationId");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_idx" ON "public"."Task"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Task_organizationId_priority_idx" ON "public"."Task"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "Task_organizationId_dueDate_idx" ON "public"."Task"("organizationId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_assignee_idx" ON "public"."Task"("assignee");

-- CreateIndex
CREATE UNIQUE INDEX "Task_integrationId_externalId_key" ON "public"."Task"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_idx" ON "public"."Transaction"("organizationId");

-- CreateIndex
CREATE INDEX "Transaction_integrationId_idx" ON "public"."Transaction"("integrationId");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_status_idx" ON "public"."Transaction"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_createdAt_idx" ON "public"."Transaction"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_customerId_idx" ON "public"."Transaction"("customerId");

-- CreateIndex
CREATE INDEX "Transaction_customerEmail_idx" ON "public"."Transaction"("customerEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_integrationId_externalId_key" ON "public"."Transaction"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "Metric_organizationId_idx" ON "public"."Metric"("organizationId");

-- CreateIndex
CREATE INDEX "Metric_integrationId_idx" ON "public"."Metric"("integrationId");

-- CreateIndex
CREATE INDEX "Metric_organizationId_name_idx" ON "public"."Metric"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Metric_organizationId_category_idx" ON "public"."Metric"("organizationId", "category");

-- CreateIndex
CREATE INDEX "Metric_organizationId_timestamp_idx" ON "public"."Metric"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "Metric_name_timestamp_idx" ON "public"."Metric"("name", "timestamp");

-- CreateIndex
CREATE INDEX "CodeActivity_organizationId_idx" ON "public"."CodeActivity"("organizationId");

-- CreateIndex
CREATE INDEX "CodeActivity_integrationId_idx" ON "public"."CodeActivity"("integrationId");

-- CreateIndex
CREATE INDEX "CodeActivity_organizationId_type_idx" ON "public"."CodeActivity"("organizationId", "type");

-- CreateIndex
CREATE INDEX "CodeActivity_organizationId_occurredAt_idx" ON "public"."CodeActivity"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "CodeActivity_author_idx" ON "public"."CodeActivity"("author");

-- CreateIndex
CREATE INDEX "CodeActivity_repository_idx" ON "public"."CodeActivity"("repository");

-- CreateIndex
CREATE UNIQUE INDEX "CodeActivity_integrationId_externalId_key" ON "public"."CodeActivity"("integrationId", "externalId");

-- CreateIndex
CREATE INDEX "Alert_organizationId_idx" ON "public"."Alert"("organizationId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "public"."Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_organizationId_isActive_idx" ON "public"."Alert"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Alert_organizationId_type_idx" ON "public"."Alert"("organizationId", "type");

-- CreateIndex
CREATE INDEX "AlertLog_alertId_idx" ON "public"."AlertLog"("alertId");

-- CreateIndex
CREATE INDEX "AlertLog_alertId_createdAt_idx" ON "public"."AlertLog"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "AlertLog_triggered_createdAt_idx" ON "public"."AlertLog"("triggered", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscription" ADD CONSTRAINT "subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Metric" ADD CONSTRAINT "Metric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Metric" ADD CONSTRAINT "Metric_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CodeActivity" ADD CONSTRAINT "CodeActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CodeActivity" ADD CONSTRAINT "CodeActivity_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AlertLog" ADD CONSTRAINT "AlertLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."Alert"("id") ON DELETE CASCADE ON UPDATE CASCADE;
