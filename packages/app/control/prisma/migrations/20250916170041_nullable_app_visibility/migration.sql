-- AlterTable
ALTER TABLE "public"."echo_apps" ALTER COLUMN "isPublic" DROP NOT NULL,
ALTER COLUMN "isPublic" DROP DEFAULT;
