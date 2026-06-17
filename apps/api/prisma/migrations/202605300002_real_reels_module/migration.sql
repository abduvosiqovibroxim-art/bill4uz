CREATE TYPE "ReelStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'DELETED');

CREATE TYPE "ReelCategory" AS ENUM ('GOOD_SHOT', 'BEST_MOMENT', 'FINAL_BALL', 'MATCH_MISTAKE', 'BEAUTIFUL_SAFETY');

CREATE TABLE "Reel" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "videoUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "category" "ReelCategory" NOT NULL,
  "clubId" TEXT NOT NULL,
  "tournamentId" TEXT,
  "playerId" TEXT,
  "authorId" TEXT NOT NULL,
  "status" "ReelStatus" NOT NULL DEFAULT 'PENDING',
  "views" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Reel_status_createdAt_idx" ON "Reel"("status", "createdAt");
CREATE INDEX "Reel_clubId_status_idx" ON "Reel"("clubId", "status");
CREATE INDEX "Reel_authorId_createdAt_idx" ON "Reel"("authorId", "createdAt");
CREATE INDEX "Reel_tournamentId_idx" ON "Reel"("tournamentId");

ALTER TABLE "Reel"
ADD CONSTRAINT "Reel_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reel"
ADD CONSTRAINT "Reel_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reel"
ADD CONSTRAINT "Reel_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Reel"
ADD CONSTRAINT "Reel_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
