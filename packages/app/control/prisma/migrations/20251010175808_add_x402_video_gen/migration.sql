-- CreateTable
CREATE TABLE "VideoGenerationX402" (
    "id" UUID NOT NULL,
    "videoId" TEXT NOT NULL,
    "wallet" TEXT,
    "cost" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VideoGenerationX402_pkey" PRIMARY KEY ("id")
);
