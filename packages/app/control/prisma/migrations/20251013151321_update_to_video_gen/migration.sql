/*
  Warnings:

  - You are about to drop the `VideoGenerationX402` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."VideoGenerationX402";

-- CreateTable
CREATE TABLE "video_generation_x402" (
    "videoId" TEXT NOT NULL,
    "wallet" TEXT,
    "cost" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "video_generation_x402_pkey" PRIMARY KEY ("videoId")
);
