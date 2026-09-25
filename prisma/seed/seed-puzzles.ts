import "dotenv/config";
import { PrismaClient, Prisma } from "../../app/generated/prisma2/client";
import fs from "fs";
import path from "path";
import readline from "readline";

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, "lichess_db_puzzle.csv");

  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  const batchSize = 500;
  let batch: Prisma.PuzzleCreateManyInput[] = [];

  let totalInserted = 0;
  const maxPuzzles = 12000;

  for await (const line of rl) {
    if (totalInserted >= maxPuzzles) break;

    lineNumber++;
    if (lineNumber === 1) continue; // cabeçalho

    const parts = line.split(",");

    const [
      puzzleId,
      fen,
      moves,
      rating,
      ratingDeviation,
      popularity,
      nbPlays,
      themes,
      gameUrl,
      openingTags,
    ] = parts;

    const ratingInt = parseInt(rating, 10);
    if (ratingInt < 1200 || ratingInt > 2000) continue;

    batch.push({
      externalId: puzzleId,
      fen,
      moves,
      rating: ratingInt,
      ratingDeviation: parseInt(ratingDeviation, 10),
      popularity: parseInt(popularity, 10),
      nbPlays: parseInt(nbPlays, 10),
      themes,
      gameUrl,
      openingTags,
    });

    if (batch.length >= batchSize || totalInserted + batch.length >= maxPuzzles) {
      const remaining = maxPuzzles - totalInserted;
      const toInsert =
        batch.length > remaining ? batch.slice(0, remaining) : batch;

      await prisma.puzzle.createMany({
        data: toInsert,
        skipDuplicates: true,
      });

      totalInserted += toInsert.length;
      console.log(`Inseridos ${totalInserted} puzzles até agora...`);

      batch = [];

      if (totalInserted >= maxPuzzles) break;
    }
  }

  // Inserir resto se ainda tiver e não atingiu o máximo
  if (batch.length > 0 && totalInserted < maxPuzzles) {
    const remaining = maxPuzzles - totalInserted;
    const toInsert =
      batch.length > remaining ? batch.slice(0, remaining) : batch;

    await prisma.puzzle.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    totalInserted += toInsert.length;
    console.log(`Inseridos ${totalInserted} puzzles no total.`);
  }

  console.log("Seed de puzzles concluído!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
