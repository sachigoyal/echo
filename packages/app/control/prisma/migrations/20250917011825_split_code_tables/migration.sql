/*
  Warnings:

  - You are about to drop the column `grantAmount` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `grantType` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `isUsed` on the `referral_codes` table. All the data in the column will be lost.
  - You are about to drop the column `reusable` on the `referral_codes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."referral_codes" DROP COLUMN "grantAmount",
DROP COLUMN "grantType",
DROP COLUMN "isUsed",
DROP COLUMN "reusable";

-- CreateTable
CREATE TABLE "public"."credit_grant_codes" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "grantAmount" DECIMAL(65,14) NOT NULL DEFAULT 0.0,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER,

    CONSTRAINT "credit_grant_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credit_grant_code_usage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "creditGrantCodeId" UUID NOT NULL,
    "grantedAmount" DECIMAL(65,14) NOT NULL,
    "usedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "credit_grant_code_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_grant_codes_code_key" ON "public"."credit_grant_codes"("code");

-- CreateIndex
CREATE INDEX "credit_grant_code_usage_creditGrantCodeId_idx" ON "public"."credit_grant_code_usage"("creditGrantCodeId");

-- CreateIndex
CREATE INDEX "credit_grant_code_usage_userId_idx" ON "public"."credit_grant_code_usage"("userId");

-- CreateIndex
CREATE INDEX "credit_grant_code_usage_usedAt_idx" ON "public"."credit_grant_code_usage"("usedAt");

-- AddForeignKey
ALTER TABLE "public"."credit_grant_code_usage" ADD CONSTRAINT "credit_grant_code_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."credit_grant_code_usage" ADD CONSTRAINT "credit_grant_code_usage_creditGrantCodeId_fkey" FOREIGN KEY ("creditGrantCodeId") REFERENCES "public"."credit_grant_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
