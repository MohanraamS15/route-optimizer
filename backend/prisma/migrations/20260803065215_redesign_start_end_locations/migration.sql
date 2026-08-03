/*
  Warnings:

  - You are about to drop the column `timeWindowEnd` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `timeWindowStart` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `depotIndex` on the `OptimizationJob` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Route" DROP CONSTRAINT "Route_jobId_fkey";

-- DropForeignKey
ALTER TABLE "RouteStop" DROP CONSTRAINT "RouteStop_routeId_fkey";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "timeWindowEnd",
DROP COLUMN "timeWindowStart",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "OptimizationJob" DROP COLUMN "depotIndex",
ADD COLUMN     "endIndex" INTEGER,
ADD COLUMN     "startIndex" INTEGER;

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OptimizationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "OptimizationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
