-- CreateEnum: Add NOT_APPLICABLE to ObligationStatus
ALTER TYPE "ObligationStatus" ADD VALUE IF NOT EXISTS 'NOT_APPLICABLE';

-- AlterTable: Add new fields to Obligation
ALTER TABLE "Obligation" ADD COLUMN IF NOT EXISTS "taxType" TEXT;
ALTER TABLE "Obligation" ADD COLUMN IF NOT EXISTS "referenceMonth" TEXT;
ALTER TABLE "Obligation" ADD COLUMN IF NOT EXISTS "notApplicableReason" TEXT;

-- CreateIndex: Add indexes for new fields
CREATE INDEX IF NOT EXISTS "Obligation_taxType_idx" ON "Obligation"("taxType");
CREATE INDEX IF NOT EXISTS "Obligation_referenceMonth_idx" ON "Obligation"("referenceMonth");

-- CreateTable: CompanyTaxProfile
CREATE TABLE IF NOT EXISTS "CompanyTaxProfile" (
    "id" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "taxType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyTaxProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyTaxProfile_companyId_idx" ON "CompanyTaxProfile"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyTaxProfile_taxType_idx" ON "CompanyTaxProfile"("taxType");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyTaxProfile_companyId_taxType_key" ON "CompanyTaxProfile"("companyId", "taxType");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CompanyTaxProfile_companyId_fkey'
    ) THEN
        ALTER TABLE "CompanyTaxProfile" ADD CONSTRAINT "CompanyTaxProfile_companyId_fkey" 
        FOREIGN KEY ("companyId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable: PasswordResetToken
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

