CREATE TYPE "TelegramGroupMatchStatus" AS ENUM ('LIVE', 'FINISHED', 'CANCELLED');

CREATE TABLE "TelegramGroupMatch" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "messageId" INTEGER,
  "playerOneTelegramId" TEXT NOT NULL,
  "playerOneName" TEXT NOT NULL,
  "playerTwoTelegramId" TEXT NOT NULL,
  "playerTwoName" TEXT NOT NULL,
  "scoreOne" INTEGER NOT NULL DEFAULT 0,
  "scoreTwo" INTEGER NOT NULL DEFAULT 0,
  "lastPointSide" INTEGER,
  "status" "TelegramGroupMatchStatus" NOT NULL DEFAULT 'LIVE',
  "createdByTelegramId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),

  CONSTRAINT "TelegramGroupMatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TelegramGroupMatch_chatId_status_idx" ON "TelegramGroupMatch"("chatId", "status");
CREATE INDEX "TelegramGroupMatch_playerOneTelegramId_createdAt_idx" ON "TelegramGroupMatch"("playerOneTelegramId", "createdAt");
CREATE INDEX "TelegramGroupMatch_playerTwoTelegramId_createdAt_idx" ON "TelegramGroupMatch"("playerTwoTelegramId", "createdAt");
CREATE INDEX "TelegramGroupMatch_createdByTelegramId_createdAt_idx" ON "TelegramGroupMatch"("createdByTelegramId", "createdAt");
