-- AlterTable
ALTER TABLE "llm_transactions" ADD COLUMN     "apiKeyId" UUID;

-- AddForeignKey
ALTER TABLE "llm_transactions" ADD CONSTRAINT "llm_transactions_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
