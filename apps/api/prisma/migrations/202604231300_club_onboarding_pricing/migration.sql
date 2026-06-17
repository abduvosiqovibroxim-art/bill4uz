ALTER TABLE "Club"
  ADD COLUMN "regularMorningPriceMinor" INTEGER,
  ADD COLUMN "regularEveningPriceMinor" INTEGER,
  ADD COLUMN "vipMorningPriceMinor" INTEGER,
  ADD COLUMN "vipEveningPriceMinor" INTEGER,
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
