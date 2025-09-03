-- Alter payouts.transactionId from UUID to TEXT to support Merit tx hashes
ALTER TABLE "payouts"
  ALTER COLUMN "transactionId" TYPE TEXT USING "transactionId"::text;


