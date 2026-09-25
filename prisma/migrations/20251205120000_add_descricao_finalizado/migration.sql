-- Add descricao (optional) and finalizado flag to torneio
ALTER TABLE "torneio" ADD COLUMN "descricao" TEXT;
ALTER TABLE "torneio" ADD COLUMN "finalizado" BOOLEAN NOT NULL DEFAULT FALSE;
