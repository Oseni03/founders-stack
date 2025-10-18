/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider]` on the table `oauth_temp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "oauth_temp_userId_provider_key" ON "public"."oauth_temp"("userId", "provider");
