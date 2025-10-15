/*
  Warnings:

  - You are about to drop the column `attributes` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `planTier` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Customer` table. All the data in the column will be lost.
  - Made the column `email` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Customer" DROP CONSTRAINT "Customer_organizationId_fkey";

-- DropIndex
DROP INDEX "public"."Customer_externalId_sourceTool_idx";

-- DropIndex
DROP INDEX "public"."Customer_organizationId_email_idx";

-- AlterTable
ALTER TABLE "public"."Customer" DROP COLUMN "attributes",
DROP COLUMN "planTier",
DROP COLUMN "updatedAt",
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "public"."FinanceSubscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "FinanceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "amountRemaining" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Balance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT,
    "sourceTool" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "availableAmount" DOUBLE PRECISION NOT NULL,
    "pendingAmount" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "data" JSONB NOT NULL,
    "previousData" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceSubscription_organizationId_customerId_idx" ON "public"."FinanceSubscription"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceSubscription_externalId_sourceTool_key" ON "public"."FinanceSubscription"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_customerId_subscriptionId_idx" ON "public"."Invoice"("organizationId", "customerId", "subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_externalId_sourceTool_key" ON "public"."Invoice"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Balance_organizationId_idx" ON "public"."Balance"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_organizationId_sourceTool_key" ON "public"."Balance"("organizationId", "sourceTool");

-- CreateIndex
CREATE INDEX "Event_organizationId_type_status_idx" ON "public"."Event"("organizationId", "type", "status");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "public"."Event"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Event_externalId_sourceTool_key" ON "public"."Event"("externalId", "sourceTool");

-- CreateIndex
CREATE INDEX "Customer_organizationId_idx" ON "public"."Customer"("organizationId");

-- AddForeignKey
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinanceSubscription" ADD CONSTRAINT "FinanceSubscription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinanceSubscription" ADD CONSTRAINT "FinanceSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invoice" ADD CONSTRAINT "Invoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."FinanceSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Balance" ADD CONSTRAINT "Balance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
