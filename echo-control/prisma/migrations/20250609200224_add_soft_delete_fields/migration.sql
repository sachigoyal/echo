-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "archivedAt" TIMESTAMPTZ,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "echo_apps" ADD COLUMN     "archivedAt" TIMESTAMPTZ,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "llm_transactions" ADD COLUMN     "archivedAt" TIMESTAMPTZ,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "archivedAt" TIMESTAMPTZ,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "archivedAt" TIMESTAMPTZ,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
