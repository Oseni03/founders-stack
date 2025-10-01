/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Note` table. All the data in the column will be lost.
  - Added the required column `tenantId` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_organizationId_fkey";

-- AlterTable
ALTER TABLE "public"."Note" DROP COLUMN "organizationId",
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
