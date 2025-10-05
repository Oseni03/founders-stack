/*
  Warnings:

  - A unique constraint covering the columns `[repositoryId]` on the table `RepositoryHealth` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RepositoryHealth_repositoryId_key" ON "public"."RepositoryHealth"("repositoryId");
