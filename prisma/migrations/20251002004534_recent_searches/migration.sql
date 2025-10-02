-- CreateTable
CREATE TABLE "public"."CDMRecentSearches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CDMRecentSearches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CDMRecentSearches_userId_createdAt_idx" ON "public"."CDMRecentSearches"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CDMRecentSearches_userId_query_key" ON "public"."CDMRecentSearches"("userId", "query");
