// lib/points.ts

import prisma from "@/lib/prisma";

/**
 * Configuração de pontos do sistema
 */
export const POINTS_CONFIG = {
  TOURNAMENT_1ST: 100,
  TOURNAMENT_2ND: 60,
  TOURNAMENT_3RD: 30,
  TOURNAMENT_OTHER: 10, // 4º lugar em diante
  DAILY_PUZZLE: 15,
  WEEKLY_PUZZLE: 50,
} as const;

/**
 * Tipos de razões para histórico de pontos
 */
export type PointsReason =
  | "tournament_1st"
  | "tournament_2nd"
  | "tournament_3rd"
  | "tournament_other"
  | "daily_puzzle"
  | "weekly_puzzle";

/**
 * Adiciona pontos a um usuário e registra no histórico
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: PointsReason,
  referenceId?: string
) {
  try {
    // Atualiza pontos do usuário e cria histórico em uma transação
    const result = await prisma.$transaction([
      // Incrementa pontos do usuário
      prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: points,
          },
        },
      }),
      // Registra no histórico
      prisma.pointsHistory.create({
        data: {
          userId,
          points,
          reason,
          referenceId,
        },
      }),
    ]);

    return result[0]; // Retorna o usuário atualizado
  } catch (error) {
    console.error("Erro ao atribuir pontos:", error);
    throw error;
  }
}

/**
 * Distribui pontos aos participantes de um torneio finalizado
 */
export async function awardTournamentPoints(torneioId: string) {
  try {
    // Busca participantes ordenados por ranking
    const participantes = await prisma.participante.findMany({
      where: { torneioId },
      include: { user: true },
      orderBy: [
        { pontos: "desc" },
        { vitorias: "desc" },
        { derrotas: "asc" },
      ],
    });

    if (participantes.length === 0) {
      console.log("Nenhum participante encontrado no torneio");
      return;
    }

    const awards: Promise<any>[] = [];

    // Distribui pontos baseado na posição
    for (let i = 0; i < participantes.length; i++) {
      const participante = participantes[i];
      let points = 0;
      let reason: PointsReason;

      if (i === 0) {
        // 1º lugar
        points = POINTS_CONFIG.TOURNAMENT_1ST;
        reason = "tournament_1st";
      } else if (i === 1) {
        // 2º lugar
        points = POINTS_CONFIG.TOURNAMENT_2ND;
        reason = "tournament_2nd";
      } else if (i === 2) {
        // 3º lugar
        points = POINTS_CONFIG.TOURNAMENT_3RD;
        reason = "tournament_3rd";
      } else {
        // 4º lugar em diante
        points = POINTS_CONFIG.TOURNAMENT_OTHER;
        reason = "tournament_other";
      }

      // Adiciona pontos ao usuário
      awards.push(
        awardPoints(participante.userId, points, reason, torneioId)
      );
    }

    // Executa todas as atribuições de pontos
    await Promise.all(awards);

    console.log(
      `Pontos distribuídos para ${participantes.length} participantes do torneio ${torneioId}`
    );

    return participantes.map((p, i) => ({
      userId: p.userId,
      position: i + 1,
      points:
        i === 0
          ? POINTS_CONFIG.TOURNAMENT_1ST
          : i === 1
          ? POINTS_CONFIG.TOURNAMENT_2ND
          : i === 2
          ? POINTS_CONFIG.TOURNAMENT_3RD
          : POINTS_CONFIG.TOURNAMENT_OTHER,
    }));
  } catch (error) {
    console.error("Erro ao distribuir pontos do torneio:", error);
    throw error;
  }
}

/**
 * Registra conclusão de puzzle e atribui pontos
 */
export async function completePuzzle(
  userId: string,
  puzzleId: string,
  type: "daily" | "weekly"
) {
  try {
    // Verifica se o usuário já completou este puzzle
    const existing = await prisma.puzzleCompletion.findUnique({
      where: {
        userId_puzzleId_type: {
          userId,
          puzzleId,
          type,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: "Puzzle já completado anteriormente",
        alreadyCompleted: true,
      };
    }

    // Define pontos baseado no tipo
    const points =
      type === "daily"
        ? POINTS_CONFIG.DAILY_PUZZLE
        : POINTS_CONFIG.WEEKLY_PUZZLE;

    const reason: PointsReason =
      type === "daily" ? "daily_puzzle" : "weekly_puzzle";

    // Cria registro de conclusão e atribui pontos em transação
    const [completion] = await prisma.$transaction([
      prisma.puzzleCompletion.create({
        data: {
          userId,
          puzzleId,
          type,
          pointsAwarded: points,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: points,
          },
        },
      }),
      prisma.pointsHistory.create({
        data: {
          userId,
          points,
          reason,
          referenceId: puzzleId,
        },
      }),
    ]);

    return {
      success: true,
      message: `Parabéns! Você ganhou ${points} pontos!`,
      points,
      completion,
    };
  } catch (error) {
    console.error("Erro ao completar puzzle:", error);
    throw error;
  }
}

/**
 * Busca histórico de pontos de um usuário
 */
export async function getUserPointsHistory(
  userId: string,
  limit = 50
) {
  try {
    const history = await prisma.pointsHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return history;
  } catch (error) {
    console.error("Erro ao buscar histórico de pontos:", error);
    throw error;
  }
}

/**
 * Verifica se usuário já completou puzzle de um tipo específico hoje/esta semana
 */
export async function hasPuzzleCompletedToday(
  userId: string,
  type: "daily" | "weekly"
) {
  try {
    const now = new Date();
    let startDate: Date;

    if (type === "daily") {
      // Início do dia atual
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      // Início da semana atual (domingo)
      const day = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    }

    const completion = await prisma.puzzleCompletion.findFirst({
      where: {
        userId,
        type,
        completedAt: {
          gte: startDate,
        },
      },
    });

    return !!completion;
  } catch (error) {
    console.error("Erro ao verificar conclusão de puzzle:", error);
    return false;
  }
}