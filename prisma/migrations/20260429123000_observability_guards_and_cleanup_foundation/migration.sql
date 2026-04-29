-- Observability foundation
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT,
  "tripId" TEXT,
  "targetUserId" TEXT,
  "targetId" TEXT,
  "summary" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_error_logs" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "userId" TEXT,
  "tripId" TEXT,
  "context" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "app_error_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rate_limit_events" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "key" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_tripId_createdAt_idx" ON "audit_logs"("tripId", "createdAt");
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");
CREATE INDEX "app_error_logs_source_createdAt_idx" ON "app_error_logs"("source", "createdAt");
CREATE INDEX "app_error_logs_tripId_createdAt_idx" ON "app_error_logs"("tripId", "createdAt");
CREATE INDEX "app_error_logs_userId_createdAt_idx" ON "app_error_logs"("userId", "createdAt");
CREATE INDEX "rate_limit_events_scope_identifier_createdAt_idx" ON "rate_limit_events"("scope", "identifier", "createdAt");
CREATE INDEX "rate_limit_events_createdAt_idx" ON "rate_limit_events"("createdAt");

-- Database-level guardrails
ALTER TABLE "trips"
  ADD CONSTRAINT "trips_budgetTarget_nonnegative" CHECK ("budgetTarget" IS NULL OR "budgetTarget" >= 0),
  ADD CONSTRAINT "trips_estimatedCostOverride_nonnegative" CHECK ("estimatedCostOverride" IS NULL OR "estimatedCostOverride" >= 0),
  ADD CONSTRAINT "trips_dates_in_order" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_totalAmount_positive" CHECK ("totalAmount" > 0);

ALTER TABLE "expense_shares"
  ADD CONSTRAINT "expense_shares_weight_positive" CHECK ("weight" IS NULL OR "weight" > 0),
  ADD CONSTRAINT "expense_shares_customAmount_nonnegative" CHECK ("customAmount" IS NULL OR "customAmount" >= 0);

ALTER TABLE "supply_items"
  ADD CONSTRAINT "supply_items_quantityNeeded_nonnegative" CHECK ("quantityNeeded" >= 0),
  ADD CONSTRAINT "supply_items_quantityOwned_nonnegative" CHECK ("quantityOwned" >= 0),
  ADD CONSTRAINT "supply_items_quantityRemaining_nonnegative" CHECK ("quantityRemaining" >= 0),
  ADD CONSTRAINT "supply_items_estimatedCost_nonnegative" CHECK ("estimatedCost" IS NULL OR "estimatedCost" >= 0),
  ADD CONSTRAINT "supply_items_actualCost_nonnegative" CHECK ("actualCost" IS NULL OR "actualCost" >= 0),
  ADD CONSTRAINT "supply_items_remaining_not_above_needed" CHECK ("quantityRemaining" <= "quantityNeeded");

ALTER TABLE "trip_invites"
  ADD CONSTRAINT "trip_invites_email_lowercase" CHECK ("email" IS NULL OR "email" = lower("email"));
