-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'UPHELD', 'REJECTED');

-- AlterTable
ALTER TABLE "BracketParticipant" ADD COLUMN     "disqualifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MatchDispute" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "filedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MatchDispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchDispute_tournamentId_status_idx" ON "MatchDispute"("tournamentId", "status");

-- CreateIndex
CREATE INDEX "MatchDispute_matchId_idx" ON "MatchDispute"("matchId");

-- AddForeignKey
ALTER TABLE "MatchDispute" ADD CONSTRAINT "MatchDispute_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "BracketMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDispute" ADD CONSTRAINT "MatchDispute_filedByUserId_fkey" FOREIGN KEY ("filedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
