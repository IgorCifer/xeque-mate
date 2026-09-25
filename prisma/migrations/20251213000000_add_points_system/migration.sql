-- CreateTable
CREATE TABLE "puzzle_completion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "puzzle_completion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "puzzle_completion_userId_idx" ON "puzzle_completion"("userId");

-- CreateIndex
CREATE INDEX "puzzle_completion_completedAt_idx" ON "puzzle_completion"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_completion_userId_puzzleId_type_key" ON "puzzle_completion"("userId", "puzzleId", "type");

-- CreateIndex
CREATE INDEX "points_history_userId_idx" ON "points_history"("userId");

-- CreateIndex
CREATE INDEX "points_history_createdAt_idx" ON "points_history"("createdAt");

-- AddForeignKey
ALTER TABLE "puzzle_completion" ADD CONSTRAINT "puzzle_completion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_completion" ADD CONSTRAINT "puzzle_completion_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;