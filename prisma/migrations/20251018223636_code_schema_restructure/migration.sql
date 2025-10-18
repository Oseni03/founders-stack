/*
  Warnings:

  - Added the required column `number` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `PullRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Branch" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "isProtected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sha" VARCHAR(40);

-- AlterTable
ALTER TABLE "public"."Commit" ADD COLUMN     "authorEmail" TEXT,
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "sha" VARCHAR(40);

-- AlterTable
ALTER TABLE "public"."Issue" ADD COLUMN     "assigneeIds" TEXT[],
ADD COLUMN     "body" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "labels" TEXT[],
ADD COLUMN     "number" INTEGER NOT NULL,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "public"."PullRequest" ADD COLUMN     "baseBranch" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "headBranch" TEXT,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "number" INTEGER NOT NULL,
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "public"."Repository" ADD COLUMN     "defaultBranch" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT;

-- AlterTable
ALTER TABLE "public"."contributor" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "lastContributedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT;
