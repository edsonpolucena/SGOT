-- CreateEnum: UserStatus
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable: Change status column type from String to UserStatus enum
-- First, update existing values to valid enum values
UPDATE "User" SET "status" = 'ACTIVE' WHERE "status" IS NULL OR "status" = '';

-- Drop the old column if it exists and is of wrong type
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    ALTER TABLE "User" DROP COLUMN "status";
  END IF;
END $$;

-- Add the status column with correct enum type
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

