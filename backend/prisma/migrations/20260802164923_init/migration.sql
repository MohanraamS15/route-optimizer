-- CreateEnum
CREATE TYPE "OptimizationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationJob" (
    "id" SERIAL NOT NULL,
    "status" "OptimizationStatus" NOT NULL DEFAULT 'PENDING',
    "vehicleCount" INTEGER NOT NULL,
    "depotIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "OptimizationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "demand" INTEGER NOT NULL,
    "timeWindowStart" INTEGER NOT NULL,
    "timeWindowEnd" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "vehicleIndex" INTEGER NOT NULL,
    "totalDistance" DOUBLE PRECISION NOT NULL,
    "totalDuration" DOUBLE PRECISION NOT NULL,
    "totalLoad" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" SERIAL NOT NULL,
    "sequence" INTEGER NOT NULL,
    "arrivalTime" INTEGER,
    "routeId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "OptimizationJob" ADD CONSTRAINT "OptimizationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OptimizationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OptimizationJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
