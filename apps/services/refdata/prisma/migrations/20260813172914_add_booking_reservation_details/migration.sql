-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "acceptedTermsVersion" TEXT,
ADD COLUMN     "addOnIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dropoffAt" TIMESTAMP(3),
ADD COLUMN     "dropoffLocationId" TEXT,
ADD COLUMN     "pickupAt" TIMESTAMP(3),
ADD COLUMN     "pickupLocationId" TEXT,
ADD COLUMN     "protectionPlanId" TEXT,
ADD COLUMN     "subtotalCents" INTEGER,
ADD COLUMN     "taxCents" INTEGER,
ADD COLUMN     "totalCents" INTEGER;
