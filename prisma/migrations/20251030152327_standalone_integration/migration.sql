/*
  Warnings:

  - The values [project_management,payment,analytics,version_control,communication,crm,other,feedback] on the enum `IntegrationCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,inactive,error,pending] on the enum `IntegrationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `accountId` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `apiKey` on the `account` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."WebhookSetupType" AS ENUM ('AUTOMATIC', 'MANUAL', 'HYBRID');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."IntegrationCategory_new" AS ENUM ('PAYMENT', 'ANALYTICS', 'CRM', 'SUPPORT', 'PROJECT_MGMT', 'COMMUNICATION', 'EMAIL_MARKETING', 'DEVELOPMENT', 'ACCOUNTING', 'SOCIAL_MEDIA', 'SEO', 'FORMS', 'SCHEDULING', 'DEVOPS', 'AI');
ALTER TABLE "public"."Integration" ALTER COLUMN "category" TYPE "public"."IntegrationCategory_new" USING ("category"::text::"public"."IntegrationCategory_new");
ALTER TYPE "public"."IntegrationCategory" RENAME TO "IntegrationCategory_old";
ALTER TYPE "public"."IntegrationCategory_new" RENAME TO "IntegrationCategory";
DROP TYPE "public"."IntegrationCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."IntegrationStatus_new" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'PENDING_SETUP', 'SYNCING');
ALTER TABLE "public"."Integration" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Integration" ALTER COLUMN "status" TYPE "public"."IntegrationStatus_new" USING ("status"::text::"public"."IntegrationStatus_new");
ALTER TYPE "public"."IntegrationStatus" RENAME TO "IntegrationStatus_old";
ALTER TYPE "public"."IntegrationStatus_new" RENAME TO "IntegrationStatus";
DROP TYPE "public"."IntegrationStatus_old";
ALTER TABLE "public"."Integration" ALTER COLUMN "status" SET DEFAULT 'PENDING_SETUP';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Integration" DROP CONSTRAINT "Integration_accountId_fkey";

-- DropIndex
DROP INDEX "public"."Integration_accountId_idx";

-- DropIndex
DROP INDEX "public"."Integration_accountId_key";

-- AlterTable
ALTER TABLE "public"."Integration" DROP COLUMN "accountId",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "apiSecret" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "webhookEvents" TEXT[],
ADD COLUMN     "webhookId" TEXT,
ADD COLUMN     "webhookSecret" TEXT,
ADD COLUMN     "webhookSetupType" "public"."WebhookSetupType" NOT NULL DEFAULT 'AUTOMATIC',
ADD COLUMN     "webhookUrl" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING_SETUP';

-- AlterTable
ALTER TABLE "public"."account" DROP COLUMN "apiKey";
