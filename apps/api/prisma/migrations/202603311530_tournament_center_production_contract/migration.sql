-- AlterEnum
ALTER TYPE "BracketFormat" ADD VALUE 'DOUBLE_ELIMINATION';

-- CreateEnum
CREATE TYPE "BracketMatchPhase" AS ENUM ('UPPER', 'LOWER', 'FINAL');

-- AlterTable
ALTER TABLE "Tournament"
ADD COLUMN "regulationFormat" JSONB,
ADD COLUMN "regulationEntryFee" JSONB,
ADD COLUMN "regulationParticipationTerms" JSONB,
ADD COLUMN "regulationRestrictions" JSONB,
ADD COLUMN "regulationNotes" JSONB;

-- AlterTable
ALTER TABLE "BracketMatch"
ADD COLUMN "phase" "BracketMatchPhase" NOT NULL DEFAULT 'UPPER',
ADD COLUMN "scheduledAt" TIMESTAMP(3),
ADD COLUMN "tableNumber" INTEGER,
ADD COLUMN "bestOf" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "isBye" BOOLEAN NOT NULL DEFAULT false;
