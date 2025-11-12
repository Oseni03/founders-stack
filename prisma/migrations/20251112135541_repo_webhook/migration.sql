-- CreateTable
CREATE TABLE "public"."Webhook" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceTool" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Webhook_externalId_sourceTool_key" ON "public"."Webhook"("externalId", "sourceTool");

-- AddForeignKey
ALTER TABLE "public"."Webhook" ADD CONSTRAINT "Webhook_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
