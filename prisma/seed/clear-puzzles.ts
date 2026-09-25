import "dotenv/config";
import { PrismaClient } from "../../app/generated/prisma2/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.puzzle.deleteMany({});
  console.log(`Puzzles removidos: ${result.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
