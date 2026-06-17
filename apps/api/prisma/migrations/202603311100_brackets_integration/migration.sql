-- CreateEnum
CREATE TYPE "BracketFormat" AS ENUM ('SINGLE_ELIMINATION');

-- CreateEnum
CREATE TYPE "BracketMatchStatus" AS ENUM ('PENDING', 'READY', 'LIVE', 'FINISHED');

-- CreateEnum
CREATE TYPE "BracketNextSlot" AS ENUM ('PLAYER1', 'PLAYER2');

-- AlterTable
ALTER TABLE "Tournament"
ADD COLUMN "bracketSize" INTEGER,
ADD COLUMN "bracketFormat" "BracketFormat" NOT NULL DEFAULT 'SINGLE_ELIMINATION';

-- CreateTable
CREATE TABLE "BracketParticipant" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "playerId" TEXT,
  "name" TEXT NOT NULL,
  "seed" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BracketParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BracketMatch" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "round" INTEGER NOT NULL,
  "matchNumber" INTEGER NOT NULL,
  "player1Id" TEXT,
  "player2Id" TEXT,
  "winnerId" TEXT,
  "loserId" TEXT,
  "status" "BracketMatchStatus" NOT NULL DEFAULT 'PENDING',
  "nextMatchId" TEXT,
  "nextSlot" "BracketNextSlot",
  "player1Score" INTEGER,
  "player2Score" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BracketMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BracketParticipant_tournamentId_seed_key" ON "BracketParticipant"("tournamentId", "seed");

-- CreateIndex
CREATE UNIQUE INDEX "BracketMatch_tournamentId_matchNumber_key" ON "BracketMatch"("tournamentId", "matchNumber");

-- AddForeignKey
ALTER TABLE "BracketParticipant" ADD CONSTRAINT "BracketParticipant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketParticipant" ADD CONSTRAINT "BracketParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketMatch" ADD CONSTRAINT "BracketMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketMatch" ADD CONSTRAINT "BracketMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "BracketParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketMatch" ADD CONSTRAINT "BracketMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "BracketParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketMatch" ADD CONSTRAINT "BracketMatch_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "BracketParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketMatch" ADD CONSTRAINT "BracketMatch_loserId_fkey" FOREIGN KEY ("loserId") REFERENCES "BracketParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BracketMatch" ADD CONSTRAINT "BracketMatch_nextMatchId_fkey" FOREIGN KEY ("nextMatchId") REFERENCES "BracketMatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
