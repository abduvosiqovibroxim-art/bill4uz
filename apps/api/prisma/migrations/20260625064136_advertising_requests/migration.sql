-- CreateEnum
CREATE TYPE "AdvertisingRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "AdvertisingRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "company" TEXT,
    "budget" TEXT,
    "message" TEXT NOT NULL,
    "status" "AdvertisingRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertisingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvertisingRequest_status_createdAt_idx" ON "AdvertisingRequest"("status", "createdAt");
