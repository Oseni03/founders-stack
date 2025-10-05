-- CreateIndex
CREATE INDEX "Commit_externalId_sourceTool_idx" ON "public"."Commit"("externalId", "sourceTool");
