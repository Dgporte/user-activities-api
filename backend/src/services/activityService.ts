import * as activityRepository from "../repository/atividade-repository";
import * as userAchievementService from "./userAchievementService";

// Constantes para valores de XP
const XP_VALUES = {
  CONFIRM_PRESENCE: 20, // XP recebido por confirmar presença
  PARTICIPANT_CONFIRMED: 10, // XP recebido pelo criador quando alguém confirma presença
  CREATE_ACTIVITY: 15, // XP recebido por criar uma atividade
  COMPLETE_ACTIVITY: 30, // XP recebido por completar uma atividade
};

export async function createActivity(activityData: any) {
  try {
    // Cria a atividade
    const activity = await activityRepository.createActivity(activityData);

    // Concede XP ao criador da atividade
    await userAchievementService.updateUserXPAndCheckAchievements(
      activityData.creatorId,
      XP_VALUES.CREATE_ACTIVITY
    );

    // Concede a conquista de criar atividade pela primeira vez
    await userAchievementService.grantAchievement(
      "Criador de Atividade",
      activityData.creatorId
    );

    return activity;
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    throw error;
  }
}

export async function confirmPresence(activityId: string, userId: string) {
  try {
    // Confirma a presença e recebe informações da participação
    const result = await activityRepository.confirmPresence(activityId, userId);

    // Concede XP ao participante que confirmou presença
    await userAchievementService.updateUserXPAndCheckAchievements(
      userId,
      XP_VALUES.CONFIRM_PRESENCE
    );

    // Concede XP ao criador da atividade
    await userAchievementService.updateUserXPAndCheckAchievements(
      result.creatorId,
      XP_VALUES.PARTICIPANT_CONFIRMED
    );

    // Concede a conquista de confirmar presença pela primeira vez
    await userAchievementService.grantAchievement("Primeiro Check-in", userId);

    return result.participation;
  } catch (error) {
    console.error("Erro ao confirmar presença:", error);
    throw error;
  }
}

export async function completeActivity(activityId: string, creatorId: string) {
  try {
    // Completa a atividade
    const activity = await activityRepository.completeActivity(
      activityId,
      creatorId
    );

    // Concede XP ao criador por completar a atividade
    await userAchievementService.updateUserXPAndCheckAchievements(
      creatorId,
      XP_VALUES.COMPLETE_ACTIVITY
    );

    // Concede a conquista de completar atividade pela primeira vez
    await userAchievementService.grantAchievement(
      "Conclusão de Atividade",
      creatorId
    );

    return activity;
  } catch (error) {
    console.error("Erro ao completar atividade:", error);
    throw error;
  }
}
