-- CreateEnum
CREATE TYPE "CoachQualification" AS ENUM ('INSTRUCTOR', 'MASTER', 'INTERNATIONAL_MASTER', 'HONORED_COACH');

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "countryId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "region" TEXT,
    "clubId" TEXT,
    "qualification" "CoachQualification" NOT NULL,
    "specialization" TEXT NOT NULL,
    "disciplines" TEXT[],
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "studentsCount" INTEGER NOT NULL DEFAULT 0,
    "personalPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "groupPriceMinor" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "achievements" TEXT[],
    "phone" TEXT,
    "telegram" TEXT,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachImage" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachReview" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachStudent" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "achievement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Coach_cityId_idx" ON "Coach"("cityId");

-- CreateIndex
CREATE INDEX "Coach_qualification_idx" ON "Coach"("qualification");

-- CreateIndex
CREATE INDEX "CoachImage_coachId_idx" ON "CoachImage"("coachId");

-- CreateIndex
CREATE INDEX "CoachReview_coachId_idx" ON "CoachReview"("coachId");

-- CreateIndex
CREATE INDEX "CoachStudent_coachId_idx" ON "CoachStudent"("coachId");

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coach" ADD CONSTRAINT "Coach_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachImage" ADD CONSTRAINT "CoachImage_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReview" ADD CONSTRAINT "CoachReview_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachStudent" ADD CONSTRAINT "CoachStudent_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;
