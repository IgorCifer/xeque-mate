-- CreateTable
CREATE TABLE "puzzle_forfeit" (
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puzzle_forfeit_pkey" PRIMARY KEY ("userId","puzzleId","type")
);

-- AddForeignKey
ALTER TABLE "puzzle_forfeit" ADD CONSTRAINT "puzzle_forfeit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puzzle_forfeit" ADD CONSTRAINT "puzzle_forfeit_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
