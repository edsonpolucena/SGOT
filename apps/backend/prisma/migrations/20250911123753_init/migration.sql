/*
  Warnings:

  - The values [SENT] on the enum `ObligationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdById` on the `Obligation` table. All the data in the column will be lost.
  - You are about to drop the column `taxpayerName` on the `Obligation` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `periodEnd` to the `Obligation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `Obligation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regime` to the `Obligation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Obligation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Obligation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Regime" AS ENUM ('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'MEI');

-- AlterEnum
BEGIN;
CREATE TYPE "ObligationStatus_new" AS ENUM ('PENDING', 'SUBMITTED', 'LATE', 'PAID', 'CANCELED');
ALTER TABLE "Obligation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Obligation" ALTER COLUMN "status" TYPE "ObligationStatus_new" USING ("status"::text::"ObligationStatus_new");
ALTER TYPE "ObligationStatus" RENAME TO "ObligationStatus_old";
ALTER TYPE "ObligationStatus_new" RENAME TO "ObligationStatus";
DROP TYPE "ObligationStatus_old";
ALTER TABLE "Obligation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Obligation" DROP CONSTRAINT "Obligation_createdById_fkey";

-- AlterTable
ALTER TABLE "Obligation" DROP COLUMN "createdById",
DROP COLUMN "taxpayerName",
ADD COLUMN     "amount" DECIMAL(10,2),
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "regime" "Regime" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Obligation_userId_idx" ON "Obligation"("userId");

-- CreateIndex
CREATE INDEX "Obligation_status_idx" ON "Obligation"("status");

-- CreateIndex
CREATE INDEX "Obligation_regime_idx" ON "Obligation"("regime");

-- CreateIndex
CREATE INDEX "Obligation_dueDate_idx" ON "Obligation"("dueDate");

-- AddForeignKey
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
