/*
  Warnings:

  - A unique constraint covering the columns `[externalId,sourceTool]` on the table `contributor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sourceTool` to the `contributor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."contributor_organizationId_externalId_key";

-- AlterTable
ALTER TABLE "public"."contributor" ADD COLUMN     "sourceTool" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "contributor_externalId_sourceTool_key" ON "public"."contributor"("externalId", "sourceTool");
