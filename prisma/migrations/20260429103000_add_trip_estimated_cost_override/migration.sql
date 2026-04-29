-- Add a manual override for the automatically calculated trip estimate.
ALTER TABLE "trips" ADD COLUMN "estimatedCostOverride" DECIMAL(12, 2);
