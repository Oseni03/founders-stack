-- CreateTable
CREATE TABLE "public"."contributor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "contributions" INTEGER NOT NULL DEFAULT 0,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contributor_organizationId_login_idx" ON "public"."contributor"("organizationId", "login");

-- CreateIndex
CREATE UNIQUE INDEX "contributor_organizationId_externalId_key" ON "public"."contributor"("organizationId", "externalId");

-- AddForeignKey
ALTER TABLE "public"."contributor" ADD CONSTRAINT "contributor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contributor" ADD CONSTRAINT "contributor_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
