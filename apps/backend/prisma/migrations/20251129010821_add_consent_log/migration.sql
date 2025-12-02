-- CreateTable
CREATE TABLE "ConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentAccepted" BOOLEAN NOT NULL,
    "consentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "termVersion" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "ConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentLog_userId_idx" ON "ConsentLog"("userId");

-- CreateIndex
CREATE INDEX "ConsentLog_consentAccepted_idx" ON "ConsentLog"("consentAccepted");

-- CreateIndex
CREATE INDEX "ConsentLog_consentDate_idx" ON "ConsentLog"("consentDate");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentLog_userId_key" ON "ConsentLog"("userId");

-- AddForeignKey
ALTER TABLE "ConsentLog" ADD CONSTRAINT "ConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
