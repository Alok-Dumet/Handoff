ALTER TABLE "bookings" ADD COLUMN "requestKey" TEXT,
  ADD COLUMN "requestHash" TEXT,
  ADD COLUMN "checkoutSnapshot" JSONB;
CREATE UNIQUE INDEX "bookings_userId_requestKey_key" ON "bookings"("userId", "requestKey");
