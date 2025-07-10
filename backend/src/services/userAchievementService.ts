import * as achievementService from "./achievementService";
import * as userAchievementRepository from "../repository/user-achievement-repository";
import * as userRepository from "../repository/user-repository";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Concede uma conquista a um usuário se ele ainda não a possui
export async function grantAchievement(
  achievementName: string,
  userId: string
) {
  // Busca a conquista pelo nome
  const achievement = await achievementService.getAchievementByName(
    achievementName
  );

  if (!achievement) {
    console.error(`Conquista "${achievementName}" não encontrada`);
    return;
  }

  // Verifica se o usuário já possui a conquista
  const userAchievement =
    await userAchievementRepository.findByAchievementIdAndUserId(
      achievement.id,
      userId
    );

  // Se já possui, não faz nada
  if (userAchievement) return;

  // Adiciona a conquista para o usuário
  await userAchievementRepository.create({
    achievementId: achievement.id,
    userId,
  });

  console.log(`Conquista "${achievementName}" concedida ao usuário ${userId}`);
}

// Retorna todas as conquistas de um usuário
export async function getUserAchievements(userId: string) {
  return await userAchievementRepository.findAchievementsByUserId(userId);
}

// Atualiza a experiência do usuário e verifica conquistas
export async function updateUserXPAndCheckAchievements(
  userId: string,
  xpToAdd: number
) {
  try {
    // Busca informações completas do usuário antes da atualização
    const userBefore = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, level: true },
    });

    if (!userBefore) {
      throw new Error("Usuário não encontrado");
    }

    // Atualiza o XP do usuário
    const updatedUser = await userRepository.updateUserXP(userId, xpToAdd);

    // Verifica se o usuário subiu de nível
    if (updatedUser.level > userBefore.level) {
      // Concede a conquista de subir de nível pela primeira vez
      await grantAchievement("Subida de Nível", userId);
    }

    return updatedUser;
  } catch (error) {
    console.error("Erro ao atualizar XP do usuário:", error);
    throw error;
  }
}
