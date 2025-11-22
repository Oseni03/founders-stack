/*
  Warnings:

  - The values [CRM,PROJECT_MGMT,EMAIL_MARKETING,DEVELOPMENT,ACCOUNTING,SOCIAL_MEDIA,SEO,AI] on the enum `IntegrationCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."IntegrationCategory_new" AS ENUM ('PAYMENT', 'ANALYTICS', 'DESIGN', 'SUPPORT', 'PROJECT_TRACKING', 'COMMUNICATION', 'CODE', 'FEEDBACK', 'SCHEDULING', 'DEVOPS', 'OTHER');
ALTER TABLE "public"."Integration" ALTER COLUMN "category" TYPE "public"."IntegrationCategory_new" USING ("category"::text::"public"."IntegrationCategory_new");
ALTER TYPE "public"."IntegrationCategory" RENAME TO "IntegrationCategory_old";
ALTER TYPE "public"."IntegrationCategory_new" RENAME TO "IntegrationCategory";
DROP TYPE "public"."IntegrationCategory_old";
COMMIT;
