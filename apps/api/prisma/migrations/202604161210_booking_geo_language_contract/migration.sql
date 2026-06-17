ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'ru';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_language_check'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_language_check" CHECK ("language" IN ('ru', 'uz'));
  END IF;
END $$;

ALTER TABLE "Club"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

UPDATE "Club"
SET
  "latitude" = COALESCE("latitude", "lat"),
  "longitude" = COALESCE("longitude", "lng")
WHERE "latitude" IS NULL OR "longitude" IS NULL;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "tableNumber" INTEGER,
  ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMP(3);

UPDATE "Booking" AS b
SET
  "tableNumber" = COALESCE(b."tableNumber", t."sortOrder"),
  "startTime" = COALESCE(b."startTime", b."startAt"),
  "endTime" = COALESCE(b."endTime", b."endAt")
FROM "ClubTable" AS t
WHERE b."tableId" = t."id"
  AND (b."tableNumber" IS NULL OR b."startTime" IS NULL OR b."endTime" IS NULL);

UPDATE "Booking"
SET
  "tableNumber" = COALESCE("tableNumber", 1),
  "startTime" = COALESCE("startTime", "startAt"),
  "endTime" = COALESCE("endTime", "endAt")
WHERE "tableNumber" IS NULL OR "startTime" IS NULL OR "endTime" IS NULL;

ALTER TABLE "Booking"
  ALTER COLUMN "tableNumber" SET NOT NULL,
  ALTER COLUMN "startTime" SET NOT NULL,
  ALTER COLUMN "endTime" SET NOT NULL,
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::TEXT,
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS "Booking_clubId_tableNumber_startTime_endTime_idx"
  ON "Booking"("clubId", "tableNumber", "startTime", "endTime");
