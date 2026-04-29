CREATE TABLE "undo_tokens" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "undo_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "undo_tokens_actorUserId_tripId_idx" ON "undo_tokens"("actorUserId", "tripId");
CREATE INDEX "undo_tokens_expiresAt_idx" ON "undo_tokens"("expiresAt");
