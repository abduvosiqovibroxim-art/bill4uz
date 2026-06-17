INSERT INTO "Discipline" ("id", "name")
VALUES
  ('discipline_free_pyramid', 'Свободная пирамида'),
  ('discipline_russian_pyramid', 'Русская пирамида')
ON CONFLICT ("name") DO NOTHING;

DELETE FROM "Discipline" AS discipline
WHERE discipline."name" IN ('8-Ball', '9-Ball', 'Snooker', 'Pyramid')
  AND NOT EXISTS (
    SELECT 1
    FROM "Tournament" AS tournament
    WHERE tournament."disciplineId" = discipline."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "Ranking" AS ranking
    WHERE ranking."disciplineId" = discipline."id"
  );
