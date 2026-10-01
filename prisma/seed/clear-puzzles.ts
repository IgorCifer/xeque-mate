import { createScriptClient } from "../script-client";

const prisma = createScriptClient();

async function main() {
  const result = await prisma.puzzle.deleteMany({});
  console.log(`Puzzles removidos: ${result.count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
