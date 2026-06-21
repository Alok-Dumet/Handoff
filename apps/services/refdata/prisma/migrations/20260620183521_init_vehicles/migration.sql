-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('automatic', 'manual');

-- CreateEnum
CREATE TYPE "VehicleClass" AS ENUM ('economy', 'compact', 'premium', 'suv');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "class" "VehicleClass" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "seats" INTEGER NOT NULL,
    "pricePerDay" INTEGER NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);
