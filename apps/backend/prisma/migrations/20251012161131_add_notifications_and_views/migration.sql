-- CreateTable: ObligationNotification
CREATE TABLE "ObligationNotification" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "sentTo" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailStatus" TEXT NOT NULL DEFAULT 'pending',
    "emailError" TEXT,

    CONSTRAINT "ObligationNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ObligationView
CREATE TABLE "ObligationView" (
    "id" TEXT NOT NULL,
    "obligationId" TEXT NOT NULL,
    "viewedBy" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,

    CONSTRAINT "ObligationView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ObligationNotification_obligationId_idx" ON "ObligationNotification"("obligationId");

-- CreateIndex
CREATE INDEX "ObligationNotification_sentTo_idx" ON "ObligationNotification"("sentTo");

-- CreateIndex
CREATE INDEX "ObligationNotification_sentAt_idx" ON "ObligationNotification"("sentAt");

-- CreateIndex
CREATE INDEX "ObligationView_obligationId_idx" ON "ObligationView"("obligationId");

-- CreateIndex
CREATE INDEX "ObligationView_viewedBy_idx" ON "ObligationView"("viewedBy");

-- CreateIndex
CREATE INDEX "ObligationView_viewedAt_idx" ON "ObligationView"("viewedAt");

-- AddForeignKey
ALTER TABLE "ObligationNotification" ADD CONSTRAINT "ObligationNotification_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObligationView" ADD CONSTRAINT "ObligationView_obligationId_fkey" FOREIGN KEY ("obligationId") REFERENCES "Obligation"("id") ON DELETE CASCADE ON UPDATE CASCADE;











