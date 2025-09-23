/*
  Warnings:

  - Changed the type of `status` on the `payouts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."EnumPayoutStatus" AS ENUM ('PENDING', 'STARTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."payouts" ADD COLUMN     "payoutBatchId" UUID;

ALTER TABLE "public"."payouts"
ALTER COLUMN "status" TYPE "public"."EnumPayoutStatus"
USING CASE
  WHEN lower("status") = 'completed' THEN 'COMPLETED'::"public"."EnumPayoutStatus"
  WHEN lower("status") = 'pending' THEN 'PENDING'::"public"."EnumPayoutStatus"
  ELSE upper("status")::"public"."EnumPayoutStatus"
END;

ALTER TABLE "public"."payouts" ALTER COLUMN "status" SET NOT NULL;
