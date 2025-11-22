/*
  Warnings:

  - The `entityType` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `entityType` on the `ActivityLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entityType` on the `Comment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sourceType` on the `LinkedItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `organizationId` to the `TaskWatcher` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."EntityType" AS ENUM ('TASK', 'MESSAGE', 'DOCUMENT', 'FEEDBACK', 'DESIGN', 'PR', 'TICKET', 'INTEGRATION', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."SourceType" AS ENUM ('TASK', 'MESSAGE', 'DOCUMENT', 'FEEDBACK', 'DESIGN', 'PR', 'TICKET');

-- AlterTable
ALTER TABLE "public"."ActivityLog" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "public"."EntityType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Comment" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "public"."EntityType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."LinkedItem" ADD COLUMN     "userId" TEXT,
DROP COLUMN "sourceType",
ADD COLUMN     "sourceType" "public"."SourceType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."Notification" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "public"."EntityType";

-- AlterTable
ALTER TABLE "public"."TaskWatcher" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "public"."ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Comment_organizationId_entityType_entityId_idx" ON "public"."Comment"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "LinkedItem_sourceType_sourceId_idx" ON "public"."LinkedItem"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkedItem_sourceType_sourceId_targetType_targetId_key" ON "public"."LinkedItem"("sourceType", "sourceId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "public"."TaskWatcher" ADD CONSTRAINT "TaskWatcher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskWatcher" ADD CONSTRAINT "TaskWatcher_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LinkedItem" ADD CONSTRAINT "fk_link_to_user" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
