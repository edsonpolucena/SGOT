/*
  Warnings:

  - Added the required column `companyId` to the `Obligation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ACCOUNTING', 'CLIENT');

-- AlterTable
ALTER TABLE "Obligation" ADD COLUMN     "companyId" INTEGER;

-- Atualizar obrigações existentes com a primeira empresa disponível
UPDATE "Obligation" SET "companyId" = (SELECT id FROM "Empresa" LIMIT 1) WHERE "companyId" IS NULL;

-- Agora tornar a coluna obrigatória
ALTER TABLE "Obligation" ALTER COLUMN     "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" INTEGER,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CLIENT';

-- CreateTable
CREATE TABLE "ObligationFile" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObligationFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObligationFile_s3Key_key" ON "ObligationFile"("s3Key");

-- CreateIndex
CREATE INDEX "ObligationFile_obligationId_idx" ON "ObligationFile"("obligationId");

-- CreateIndex
CREATE INDEX "ObligationFile_uploadedBy_idx" ON "ObligationFile"("uploadedBy");

-- CreateIndex
CREATE INDEX "Obligation_companyId_idx" ON "Obligation"("companyId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligation" ADD CONSTRAINT "Obligation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationFile" ADD CONSTRAINT "ObligationFile_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
