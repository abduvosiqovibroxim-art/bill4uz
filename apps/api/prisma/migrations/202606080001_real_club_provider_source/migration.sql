ALTER TABLE "Club" ADD COLUMN "source" TEXT;
ALTER TABLE "Club" ADD COLUMN "sourceId" TEXT;

CREATE INDEX "Club_source_sourceId_idx" ON "Club"("source", "sourceId");

UPDATE "Club"
SET "deletedAt" = COALESCE("deletedAt", NOW())
WHERE lower("name") = lower(concat('Black', ' ', 'Pool'))
  AND "source" IS NULL;
