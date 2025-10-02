-- CreateTable
CREATE TABLE "public"."UserPreferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingProgress" JSONB,
    "theme" VARCHAR(50) NOT NULL DEFAULT 'system',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "slackNotifications" BOOLEAN NOT NULL DEFAULT false,
    "defaultDashboardView" VARCHAR(100) NOT NULL DEFAULT 'overview',
    "dashboardLayout" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "public"."UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "public"."UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_onboardingCompleted_idx" ON "public"."UserPreferences"("onboardingCompleted");
