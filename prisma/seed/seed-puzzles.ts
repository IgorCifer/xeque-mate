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
  let totalCreated = 0;
  const maxPuzzles = 12000;

  // Faixas do desafio diário (1200-1699) e semanal (1700-2000).
  const minRating = 1200;
  const maxRating = 2000;
  // Popularidade vai de -100 a 100; abaixo disso costumam ser puzzles
  // mal avaliados ou ambíguos pelos jogadores do Lichess.
  const minPopularity = 90;
  const minPlays = 1000;

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
    const ratingDeviationInt = parseInt(ratingDeviation, 10);
    const popularityInt = parseInt(popularity, 10);
    const nbPlaysInt = parseInt(nbPlays, 10);

    // Linha malformada: NaN passaria pelas comparações abaixo.
    if (
      [ratingInt, ratingDeviationInt, popularityInt, nbPlaysInt].some(
        Number.isNaN
      )
    ) {
      continue;
    }

    if (ratingInt < minRating || ratingInt > maxRating) continue;
    if (popularityInt < minPopularity || nbPlaysInt < minPlays) continue;

    batch.push({
      externalId: puzzleId,
      fen,
      moves,
      rating: ratingInt,
      ratingDeviation: ratingDeviationInt,
      popularity: popularityInt,
      nbPlays: nbPlaysInt,
      themes,
      gameUrl,
      openingTags,
    });

    if (batch.length >= batchSize || totalInserted + batch.length >= maxPuzzles) {
      const remaining = maxPuzzles - totalInserted;
      const toInsert =
        batch.length > remaining ? batch.slice(0, remaining) : batch;

      const { count } = await prisma.puzzle.createMany({
        data: toInsert,
        skipDuplicates: true,
      });

      totalInserted += toInsert.length;
      totalCreated += count;
      console.log(
        `Processados ${totalInserted} puzzles até agora (${totalCreated} novos)...`
      );

      batch = [];

      if (totalInserted >= maxPuzzles) break;
    }
  }

  // Inserir resto se ainda tiver e não atingiu o máximo
  if (batch.length > 0 && totalInserted < maxPuzzles) {
    const remaining = maxPuzzles - totalInserted;
    const toInsert =
      batch.length > remaining ? batch.slice(0, remaining) : batch;

    const { count } = await prisma.puzzle.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    totalInserted += toInsert.length;
    totalCreated += count;
  }

  // Duplicados (reexecução) contam como processados, mas não como novos.
  console.log(
    `Seed de puzzles concluído: ${totalInserted} processados, ${totalCreated} novos.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
