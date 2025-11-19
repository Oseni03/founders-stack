/*
  Warnings:

  - Added the required column `platform` to the `Commit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Commit" ADD COLUMN     "platform" TEXT NOT NULL;
