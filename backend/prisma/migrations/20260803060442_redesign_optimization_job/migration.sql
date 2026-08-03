/*
  Warnings:

  - The values [PENDING] on the enum `OptimizationStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `jobName` to the `OptimizationJob` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `OptimizationJob` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OptimizationStatus_new" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'FAILED');
ALTER TABLE "public"."OptimizationJob" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OptimizationJob" ALTER COLUMN "status" TYPE "OptimizationStatus_new" USING ("status"::text::"OptimizationStatus_new");
ALTER TYPE "OptimizationStatus" RENAME TO "OptimizationStatus_old";
ALTER TYPE "OptimizationStatus_new" RENAME TO "OptimizationStatus";
DROP TYPE "public"."OptimizationStatus_old";
ALTER TABLE "OptimizationJob" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "OptimizationJob" DROP CONSTRAINT "OptimizationJob_userId_fkey";

-- AlterTable
ALTER TABLE "OptimizationJob" ADD COLUMN     "jobName" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT',
ALTER COLUMN "depotIndex" DROP NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "OptimizationJob" ADD CONSTRAINT "OptimizationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
