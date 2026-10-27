CREATE TABLE confirmation_emails (
 "bookingId" TEXT PRIMARY KEY, recipient TEXT NOT NULL, subject TEXT NOT NULL,
 text TEXT NOT NULL, html TEXT NOT NULL, "messageId" TEXT NOT NULL UNIQUE,
 attempts INTEGER NOT NULL DEFAULT 0, "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lockedUntil" TIMESTAMP(3), "lockToken" TEXT, "lastError" TEXT,
 "sentAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "confirmation_emails_sentAt_nextAttemptAt_idx" ON confirmation_emails ("sentAt", "nextAttemptAt");
