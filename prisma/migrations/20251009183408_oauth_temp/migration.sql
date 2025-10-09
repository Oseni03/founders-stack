/*
  Warnings:

  - You are about to drop the column `metadata` on the `Integration` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."Integration" DROP COLUMN "metadata";

-- CreateTable
CREATE TABLE "public"."oauth_temp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "oauthToken" TEXT NOT NULL,
    "oauthTokenSecret" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_temp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oauth_temp_userId_provider_idx" ON "public"."oauth_temp"("userId", "provider");

-- AddForeignKey
ALTER TABLE "public"."oauth_temp" ADD CONSTRAINT "oauth_temp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
