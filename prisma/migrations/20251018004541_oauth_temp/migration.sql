-- AlterTable
ALTER TABLE "public"."oauth_temp" ADD COLUMN     "state" TEXT,
ALTER COLUMN "oauthToken" DROP NOT NULL,
ALTER COLUMN "oauthTokenSecret" DROP NOT NULL;
