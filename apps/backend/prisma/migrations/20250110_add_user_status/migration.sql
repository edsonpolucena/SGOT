-- Cria o enum se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserStatus') THEN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END $$;

-- Caso a tabela se chame "User"
DO $$
BEGIN
  IF to_regclass('"User"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'status'
    ) THEN
      ALTER TABLE "User"
        ADD COLUMN "status" "UserStatus" DEFAULT 'ACTIVE'::"UserStatus" NOT NULL;
    ELSE
      EXECUTE 'UPDATE "User" SET "status" = ''ACTIVE'' WHERE "status" IS NULL OR "status"::text = ''''''';
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User'
          AND column_name = 'status' AND udt_name = 'UserStatus'
      ) THEN
        ALTER TABLE "User"
          ALTER COLUMN "status" TYPE "UserStatus"
          USING (
            CASE
              WHEN "status"::text IN (''ACTIVE'',''INACTIVE'') THEN "status"::text::"UserStatus"
              ELSE ''ACTIVE''::"UserStatus"
            END
          );
      END IF;
      ALTER TABLE "User"
        ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
        ALTER COLUMN "status" SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Caso a tabela se chame users
DO $$
BEGIN
  IF to_regclass('users') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status'
    ) THEN
      ALTER TABLE users
        ADD COLUMN status "UserStatus" DEFAULT 'ACTIVE'::"UserStatus" NOT NULL;
    ELSE
      UPDATE users SET status = 'ACTIVE' WHERE status IS NULL OR status::text = '';
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name = 'status' AND udt_name = 'UserStatus'
      ) THEN
        ALTER TABLE users
          ALTER COLUMN status TYPE "UserStatus"
          USING (
            CASE
              WHEN status::text IN ('ACTIVE','INACTIVE') THEN status::text::"UserStatus"
              ELSE 'ACTIVE'::"UserStatus"
            END
          );
      END IF;
      ALTER TABLE users
        ALTER COLUMN status SET DEFAULT 'ACTIVE',
        ALTER COLUMN status SET NOT NULL;
    END IF;
  END IF;
END $$;
