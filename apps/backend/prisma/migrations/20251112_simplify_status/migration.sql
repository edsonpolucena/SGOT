-- Primeiro, converter todos os status antigos para PENDING
UPDATE "Obligation" 
SET status = 'PENDING' 
WHERE status IN ('SUBMITTED', 'LATE', 'PAID', 'CANCELED');

-- Criar novo enum com apenas PENDING e NOT_APPLICABLE
CREATE TYPE "ObligationStatus_new" AS ENUM ('PENDING', 'NOT_APPLICABLE');

-- Alterar coluna para usar o novo enum
ALTER TABLE "Obligation" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ObligationStatus_new" 
    USING ("status"::text::"ObligationStatus_new"),
  ALTER COLUMN "status" SET DEFAULT 'PENDING'::"ObligationStatus_new";

-- Remover enum antigo
DROP TYPE "ObligationStatus";

-- Renomear novo enum
ALTER TYPE "ObligationStatus_new" RENAME TO "ObligationStatus";

