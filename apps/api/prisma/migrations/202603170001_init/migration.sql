-- Create enums
CREATE TYPE "Role" AS ENUM ('PLAYER', 'CLUB', 'ORGANIZER', 'ADMIN');
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'LIVE', 'FINISHED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create tables
CREATE TABLE "Country" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "City" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "countryId" TEXT NOT NULL,
  CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Player" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "countryId" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "clubId" TEXT,
  "elo" INTEGER NOT NULL DEFAULT 1000,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "achievements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Club" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "countryId" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "telegram" TEXT NOT NULL,
  "tables" INTEGER NOT NULL,
  "disciplines" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lat" DOUBLE PRECISION,
  "lng" DOUBLE PRECISION,
  CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Discipline" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Tournament" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "disciplineId" TEXT NOT NULL,
  "organizerId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "prizePool" INTEGER NOT NULL,
  "status" "TournamentStatus" NOT NULL,
  "participants" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "playerAId" TEXT NOT NULL,
  "playerBId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "scoreA" INTEGER,
  "scoreB" INTEGER,
  "winnerId" TEXT,
  "bracketRound" INTEGER NOT NULL,
  CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ranking" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "disciplineId" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "News" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Gallery" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "playerId" TEXT,
  "galleryId" TEXT,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Application" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");
CREATE UNIQUE INDEX "City_countryId_name_key" ON "City"("countryId", "name");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
CREATE UNIQUE INDEX "Club_userId_key" ON "Club"("userId");
CREATE UNIQUE INDEX "Discipline_name_key" ON "Discipline"("name");
CREATE UNIQUE INDEX "Ranking_playerId_disciplineId_cityId_key" ON "Ranking"("playerId", "disciplineId", "cityId");
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");
CREATE UNIQUE INDEX "Application_playerId_tournamentId_key" ON "Application"("playerId", "tournamentId");

-- Create foreign keys
ALTER TABLE "City"
ADD CONSTRAINT "City_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Player"
ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Player"
ADD CONSTRAINT "Player_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Player"
ADD CONSTRAINT "Player_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Player"
ADD CONSTRAINT "Player_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Club"
ADD CONSTRAINT "Club_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Club"
ADD CONSTRAINT "Club_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Club"
ADD CONSTRAINT "Club_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tournament"
ADD CONSTRAINT "Tournament_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tournament"
ADD CONSTRAINT "Tournament_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match"
ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match"
ADD CONSTRAINT "Match_playerAId_fkey" FOREIGN KEY ("playerAId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Match"
ADD CONSTRAINT "Match_playerBId_fkey" FOREIGN KEY ("playerBId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ranking"
ADD CONSTRAINT "Ranking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ranking"
ADD CONSTRAINT "Ranking_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Ranking"
ADD CONSTRAINT "Ranking_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MediaAsset"
ADD CONSTRAINT "MediaAsset_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MediaAsset"
ADD CONSTRAINT "MediaAsset_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "Gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Application"
ADD CONSTRAINT "Application_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Application"
ADD CONSTRAINT "Application_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
