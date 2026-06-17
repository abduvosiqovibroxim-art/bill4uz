ALTER TABLE "BracketMatch"
ADD COLUMN "loserNextMatchId" TEXT,
ADD COLUMN "loserNextSlot" "BracketNextSlot";

ALTER TABLE "BracketMatch"
ADD CONSTRAINT "BracketMatch_loserNextMatchId_fkey"
FOREIGN KEY ("loserNextMatchId") REFERENCES "BracketMatch"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
