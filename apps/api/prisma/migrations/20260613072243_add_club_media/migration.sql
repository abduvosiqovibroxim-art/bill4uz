-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ClubImage" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClubImage_clubId_idx" ON "ClubImage"("clubId");

-- AddForeignKey
ALTER TABLE "ClubImage" ADD CONSTRAINT "ClubImage_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
