ALTER TYPE "TournamentStatus" RENAME TO "TournamentStatus_old";

CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'LIVE', 'FINISHED');

ALTER TABLE "Tournament"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "TournamentStatus"
  USING (
    CASE
      WHEN "status"::text = 'UPCOMING' THEN 'REGISTRATION'
      ELSE "status"::text
    END
  )::"TournamentStatus",
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "TournamentStatus_old";
