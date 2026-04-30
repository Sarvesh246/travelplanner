ALTER TABLE "stays"
  ADD COLUMN "arrivalTime" TEXT,
  ADD COLUMN "checkInTime" TEXT,
  ADD COLUMN "checkOutTime" TEXT,
  ADD COLUMN "leaveTime" TEXT;

ALTER TABLE "activities"
  ADD COLUMN "startTime" TEXT,
  ADD COLUMN "endTime" TEXT;

UPDATE "activities"
SET "startTime" = "scheduledTime"
WHERE "scheduledTime" IS NOT NULL;

ALTER TABLE "activities"
  DROP COLUMN "scheduledTime";
