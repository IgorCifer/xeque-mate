import { PrismaClient } from "../app/generated/prisma2/client";

const prisma = new PrismaClient();
const query = "SELECT column_name,data_type,udt_name FROM information_schema.columns WHERE table_name='participante' AND table_schema='public' ORDER BY ordinal_position";

(async () => {
  try {
    const rows = await prisma.$queryRawUnsafe(query);
    console.log(rows);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();
