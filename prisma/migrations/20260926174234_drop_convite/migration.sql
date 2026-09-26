-- DropForeignKey
ALTER TABLE "convite" DROP CONSTRAINT "convite_criadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "convite" DROP CONSTRAINT "convite_torneioId_fkey";

-- DropForeignKey
ALTER TABLE "convite" DROP CONSTRAINT "convite_usadoPorId_fkey";

-- DropTable
DROP TABLE "convite";

