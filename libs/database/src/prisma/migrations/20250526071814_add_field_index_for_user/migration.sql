-- AlterTable
ALTER TABLE "User" ADD COLUMN     "indexedAt" TIMESTAMP(3),
ADD COLUMN     "isIndexed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_isIndexed_idx" ON "User"("isIndexed");
