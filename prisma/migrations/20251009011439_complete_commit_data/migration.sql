/*
  Warnings:

  - You are about to drop the column `authorId` on the `Commit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Commit" DROP COLUMN "authorId",
ADD COLUMN     "additions" INTEGER,
ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "committerName" TEXT,
ADD COLUMN     "deletions" INTEGER,
ADD COLUMN     "total" INTEGER,
ADD COLUMN     "url" TEXT;
