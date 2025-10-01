/*
  Warnings:

  - You are about to drop the column `maxNotes` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsers` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Note" DROP CONSTRAINT "Note_tenantId_fkey";

-- AlterTable
ALTER TABLE "public"."Integration" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "public"."subscription" DROP COLUMN "maxNotes",
DROP COLUMN "maxUsers";

-- DropTable
DROP TABLE "public"."Note";

-- AddForeignKey
ALTER TABLE "public"."Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
