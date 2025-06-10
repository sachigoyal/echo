-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "createdByUserId" UUID,
ADD COLUMN     "customerRole" TEXT,
ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'owner';

-- AlterTable
ALTER TABLE "llm_transactions" ADD COLUMN     "billedToUserId" UUID;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "payerUserId" UUID;

-- CreateTable
CREATE TABLE "app_memberships" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "echoAppId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "app_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_memberships_userId_echoAppId_key" ON "app_memberships"("userId", "echoAppId");

-- AddForeignKey
ALTER TABLE "app_memberships" ADD CONSTRAINT "app_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_memberships" ADD CONSTRAINT "app_memberships_echoAppId_fkey" FOREIGN KEY ("echoAppId") REFERENCES "echo_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_transactions" ADD CONSTRAINT "llm_transactions_billedToUserId_fkey" FOREIGN KEY ("billedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
