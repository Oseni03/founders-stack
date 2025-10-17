/*
  Warnings:

  - You are about to drop the `MessageThread` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."MessageThread" DROP CONSTRAINT "MessageThread_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MessageThread" DROP CONSTRAINT "MessageThread_relatedTaskId_fkey";

-- DropTable
DROP TABLE "public"."MessageThread";

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "user" TEXT,
    "channelId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_externalId_sourceTool_organizationId_idx" ON "public"."Message"("externalId", "sourceTool", "organizationId");

-- CreateIndex
CREATE INDEX "Message_channelId_idx" ON "public"."Message"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalId_sourceTool_key" ON "public"."Message"("externalId", "sourceTool");

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
