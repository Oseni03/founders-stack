/*
  Warnings:

  - Changed the type of `type` on the `Integration` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."IntegrationType" AS ENUM ('oauth', 'api_key');

-- AlterTable
ALTER TABLE "public"."Integration" DROP COLUMN "type",
ADD COLUMN     "type" "public"."IntegrationType" NOT NULL;
