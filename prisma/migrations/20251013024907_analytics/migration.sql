/*
  Warnings:

  - You are about to drop the `UserReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserReport" DROP CONSTRAINT "UserReport_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserReport" DROP CONSTRAINT "UserReport_relatedTransactionId_fkey";

-- DropTable
DROP TABLE "public"."UserReport";

-- CreateTable
CREATE TABLE "public"."AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "eventType" TEXT,
    "referrer" TEXT,
    "referringDomain" TEXT,
    "timezone" TEXT,
    "pathname" TEXT,
    "deviceType" TEXT,
    "browserLanguagePrefix" TEXT,
    "geoipCityName" TEXT,
    "geoipCountryName" TEXT,
    "geoipCountryCode" TEXT,
    "geoipContinentName" TEXT,
    "geoipContinentCode" TEXT,
    "attributes" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_externalId_sourceTool_idx" ON "public"."AnalyticsEvent"("externalId", "sourceTool");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_organizationId_key" ON "public"."AnalyticsEvent"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_externalId_sourceTool_key" ON "public"."AnalyticsEvent"("externalId", "sourceTool");

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
