-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('CASHIER', 'WAITER', 'ADMINISTRATOR', 'TRAINER', 'BARTENDER', 'COOK');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'ONLINE', 'TERMINAL', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BOOKING_PAYMENT', 'TABLE_SESSION', 'MENU_ORDER', 'REFUND', 'CASH_IN', 'CASH_OUT');

-- CreateEnum
CREATE TYPE "MenuItemCategory" AS ENUM ('DRINKS', 'HOT_DRINKS', 'FOOD', 'SNACKS', 'DESSERTS', 'ALCOHOL', 'HOOKAH', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'PAID');

-- CreateEnum
CREATE TYPE "TableSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FINISHED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Club" ALTER COLUMN "disciplines" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ClubTable" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "achievements" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Ranking" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "descriptionText" JSONB,
ADD COLUMN     "registrationLabelText" JSONB,
ALTER COLUMN "status" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "role" "StaffRole" NOT NULL,
    "userId" TEXT,
    "hourlyRateMinor" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminationDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "openingCashMinor" INTEGER,
    "closingCashMinor" INTEGER,
    "totalSalesMinor" INTEGER NOT NULL DEFAULT 0,
    "totalCashMinor" INTEGER NOT NULL DEFAULT 0,
    "totalCardMinor" INTEGER NOT NULL DEFAULT 0,
    "totalOnlineMinor" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "bookingId" TEXT,
    "tableSessionId" TEXT,
    "menuOrderId" TEXT,
    "receiptNumber" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameUz" TEXT,
    "description" TEXT,
    "category" "MenuItemCategory" NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "preparationTimeMinutes" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuOrder" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "tableId" TEXT,
    "orderNumber" INTEGER NOT NULL,
    "customerName" TEXT,
    "tableNumber" INTEGER,
    "qrCode" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "waiterId" TEXT,
    "subtotalMinor" INTEGER NOT NULL DEFAULT 0,
    "totalMinor" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "preparingAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceMinor" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableSession" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "shiftId" TEXT,
    "status" "TableSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "totalPausedMinutes" INTEGER NOT NULL DEFAULT 0,
    "priceMinor" INTEGER,
    "customerName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "tableId" TEXT,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MENU',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_clubId_isActive_idx" ON "Staff"("clubId", "isActive");

-- CreateIndex
CREATE INDEX "Staff_clubId_role_idx" ON "Staff"("clubId", "role");

-- CreateIndex
CREATE INDEX "Shift_clubId_status_idx" ON "Shift"("clubId", "status");

-- CreateIndex
CREATE INDEX "Shift_staffId_startedAt_idx" ON "Shift"("staffId", "startedAt");

-- CreateIndex
CREATE INDEX "Shift_clubId_startedAt_idx" ON "Shift"("clubId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_bookingId_key" ON "Transaction"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_tableSessionId_key" ON "Transaction"("tableSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_menuOrderId_key" ON "Transaction"("menuOrderId");

-- CreateIndex
CREATE INDEX "Transaction_clubId_createdAt_idx" ON "Transaction"("clubId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_shiftId_createdAt_idx" ON "Transaction"("shiftId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_createdAt_idx" ON "Transaction"("type", "createdAt");

-- CreateIndex
CREATE INDEX "MenuItem_clubId_category_isAvailable_idx" ON "MenuItem"("clubId", "category", "isAvailable");

-- CreateIndex
CREATE INDEX "MenuItem_clubId_deletedAt_idx" ON "MenuItem"("clubId", "deletedAt");

-- CreateIndex
CREATE INDEX "MenuOrder_clubId_createdAt_idx" ON "MenuOrder"("clubId", "createdAt");

-- CreateIndex
CREATE INDEX "MenuOrder_clubId_status_idx" ON "MenuOrder"("clubId", "status");

-- CreateIndex
CREATE INDEX "MenuOrder_tableId_status_idx" ON "MenuOrder"("tableId", "status");

-- CreateIndex
CREATE INDEX "MenuOrderItem_orderId_idx" ON "MenuOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "TableSession_clubId_status_idx" ON "TableSession"("clubId", "status");

-- CreateIndex
CREATE INDEX "TableSession_tableId_status_idx" ON "TableSession"("tableId", "status");

-- CreateIndex
CREATE INDEX "TableSession_shiftId_idx" ON "TableSession"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");

-- CreateIndex
CREATE INDEX "QRCode_clubId_isActive_idx" ON "QRCode"("clubId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_clubId_tableId_type_key" ON "QRCode"("clubId", "tableId", "type");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tableSessionId_fkey" FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_menuOrderId_fkey" FOREIGN KEY ("menuOrderId") REFERENCES "MenuOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOrder" ADD CONSTRAINT "MenuOrder_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOrder" ADD CONSTRAINT "MenuOrder_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "ClubTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOrder" ADD CONSTRAINT "MenuOrder_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOrderItem" ADD CONSTRAINT "MenuOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MenuOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuOrderItem" ADD CONSTRAINT "MenuOrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "ClubTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "ClubTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
