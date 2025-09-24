/*
  Warnings:

  - Changed the type of `type` on the `payouts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."EnumPayoutType" AS ENUM ('MARKUP', 'REFERRAL');

-- AlterTable
ALTER TABLE "public"."payouts"
ALTER COLUMN "type" TYPE "public"."EnumPayoutType"
USING CASE
  WHEN lower("type") = 'markup' THEN 'MARKUP'::"public"."EnumPayoutType"
  WHEN lower("type") = 'referral' THEN 'REFERRAL'::"public"."EnumPayoutType"
  ELSE upper("type")::"public"."EnumPayoutType"
END;

ALTER TABLE "public"."payouts" ALTER COLUMN "type" SET NOT NULL;
