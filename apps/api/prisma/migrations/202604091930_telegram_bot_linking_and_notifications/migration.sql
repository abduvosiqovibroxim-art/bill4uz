ALTER TABLE "User"
ADD COLUMN "telegramId" TEXT,
ADD COLUMN "telegramUsername" TEXT,
ADD COLUMN "telegramLinkedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

ALTER TABLE "Notification"
ADD COLUMN "eventKey" TEXT,
ADD COLUMN "telegramDeliveredAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Notification_eventKey_key" ON "Notification"("eventKey");

CREATE TABLE "TelegramLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TelegramLinkToken_tokenHash_key" ON "TelegramLinkToken"("tokenHash");
CREATE UNIQUE INDEX "TelegramLinkToken_code_key" ON "TelegramLinkToken"("code");
CREATE INDEX "TelegramLinkToken_userId_idx" ON "TelegramLinkToken"("userId");

ALTER TABLE "TelegramLinkToken"
ADD CONSTRAINT "TelegramLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
